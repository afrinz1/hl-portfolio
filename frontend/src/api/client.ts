import type { FieldErrors } from './types';

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;
  nonFieldErrors: string[];

  constructor(
    message: string,
    status = 0,
    fieldErrors: FieldErrors = {},
    nonFieldErrors: string[] = []
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.nonFieldErrors = nonFieldErrors;
  }
}

const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

/**
 * Normalizes VITE_API_BASE_URL so /api/v1/ is targeted exclusively without duplicating prefixes.
 */
function getApiRoot(): string {
  if (!rawBase) return '/api/v1';
  if (rawBase.endsWith('/api/v1')) return rawBase;
  return `${rawBase}/api/v1`;
}

/**
 * Resolves relative media paths returned by Django (e.g. /media/...) against VITE_API_BASE_URL origin.
 */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (!rawBase) return path;
  try {
    const origin = new URL(rawBase).origin;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  } catch {
    const cleanBase = rawBase.replace(/\/api\/v1$/, '');
    return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
  }
}

export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullPath = `${getApiRoot()}${cleanEndpoint}`;

  if (!params) return fullPath;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${fullPath}?${qs}` : fullPath;
}

/**
 * Extracts query page number from a DRF next/previous pagination link.
 */
export function extractPageFromUrl(pageUrl: string | null): number | null {
  if (!pageUrl) return null;
  try {
    const url = new URL(pageUrl, window.location.origin);
    const p = url.searchParams.get('page');
    if (p) {
      const parsed = Number(p);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return 1;
  } catch {
    return null;
  }
}

function parseDrfErrors(data: unknown, status: number): ApiError {
  if (!data || typeof data !== 'object') {
    return new ApiError(`Request failed with status ${status}.`, status);
  }

  const record = data as Record<string, unknown>;
  const fieldErrors: FieldErrors = {};
  const nonFieldErrors: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const messages = Array.isArray(value)
      ? value.map(String)
      : typeof value === 'string'
        ? [value]
        : [];

    if (messages.length === 0) continue;

    if (key === 'non_field_errors' || key === 'detail') {
      nonFieldErrors.push(...messages);
    } else {
      fieldErrors[key] = messages;
    }
  }

  const summary =
    nonFieldErrors[0] ||
    Object.values(fieldErrors).flat()[0] ||
    `Request failed with status ${status}.`;

  return new ApiError(summary, status, fieldErrors, nonFieldErrors);
}

// ---------------------------------------------------------------------------
// In-memory JWT access token (never stored in localStorage / cookies)
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

// ---------------------------------------------------------------------------
// CSRF token (Django's double-submit cookie)
//
// Django sets a readable `csrftoken` cookie and expects the same value back in
// the X-CSRFToken header on unsafe requests. We keep the token in memory when
// the API returns it, and fall back to reading the cookie directly.
// ---------------------------------------------------------------------------
const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';

let _csrfToken: string | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCsrfToken(token: string | null): void {
  _csrfToken = token;
}

export function getCsrfToken(): string | null {
  return _csrfToken ?? readCookie(CSRF_COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Silent token refresh (uses HttpOnly refresh-token cookie automatically)
// ---------------------------------------------------------------------------
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

export async function attemptTokenRefresh(): Promise<string | null> {
  if (_isRefreshing) {
    // Queue callers while a refresh is already in-flight
    return new Promise((resolve) => _refreshQueue.push(resolve));
  }

  _isRefreshing = true;
  try {
    const url = buildApiUrl('/auth/token/refresh/');
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include', // sends the HttpOnly refresh cookie
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data: { access: string } = await res.json();
      setAccessToken(data.access);
      _refreshQueue.forEach((cb) => cb(data.access));
      return data.access;
    }

    // Refresh failed (cookie expired / blacklisted)
    clearAccessToken();
    _refreshQueue.forEach((cb) => cb(null));
    return null;
  } catch {
    clearAccessToken();
    _refreshQueue.forEach((cb) => cb(null));
    return null;
  } finally {
    _isRefreshing = false;
    _refreshQueue = [];
  }
}

// Custom event dispatched when a 401 cannot be recovered
export const AUTH_EXPIRED_EVENT = 'hectic:auth:expired';

export interface ApiRequestOptions extends RequestInit {
  /**
   * Surface a 401 response as-is instead of running the silent refresh +
   * retry flow. The login endpoint sets this: there a 401 means "invalid
   * credentials", not "expired session", and a refresh attempt would replace
   * the real error with a misleading "Session expired" message.
   */
  skipAuthRefresh?: boolean;
}

export async function apiRequest<T>(
  url: string,
  options?: ApiRequestOptions
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  // Attach bearer token when available
  if (_accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  // Attach the CSRF token on unsafe methods so Django's CSRF middleware
  // accepts the request once a session/refresh cookie is in play.
  const method = (options?.method ?? 'GET').toUpperCase();
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method);
  if (isUnsafeMethod) {
    const csrf = getCsrfToken();
    if (csrf && !headers[CSRF_HEADER_NAME]) {
      headers[CSRF_HEADER_NAME] = csrf;
    }
  }

  const makeRequest = async () =>
    fetch(url, {
      ...options,
      // Send cookies on every request (same-origin via the dev proxy, or
      // cross-origin once CORS allows credentials) so the CSRF cookie and the
      // HttpOnly refresh cookie travel with the request.
      credentials: options?.credentials ?? 'include',
      headers,
    });

  let response: Response;
  try {
    response = await makeRequest();
  } catch {
    throw new ApiError(
      'Unable to reach the Hectic Lab API. Verify VITE_API_BASE_URL and server connectivity.',
      0
    );
  }

  // --- 401 handling: attempt a silent refresh and retry once ---
  // Skipped for endpoints where a 401 is a meaningful result (the login
  // endpoint) rather than a signal that the access token needs renewing.
  if (response.status === 401 && !options?.skipAuthRefresh) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      // Update bearer header and retry
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(url, {
          ...options,
          credentials: options?.credentials ?? 'include',
          headers,
        });
      } catch {
        throw new ApiError(
          'Unable to reach the Hectic Lab API. Verify VITE_API_BASE_URL and server connectivity.',
          0
        );
      }
    }

    // Still 401 after refresh attempt → session is truly gone
    if (response.status === 401) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (response.status === 204) {
    return null as unknown as T;
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503) {
      throw new ApiError(
        'Backend server unavailable (HTTP 502/503). The API is unreachable or starting up — check that the Django backend is running and reachable at VITE_API_BASE_URL, then try again.',
        response.status
      );
    }
    if (isJson) {
      const errData = await response.json().catch(() => null);
      const error = parseDrfErrors(errData, response.status);
      // Surface CSRF failures as an actionable message instead of the raw
      // middleware detail.
      if (response.status === 403 && /csrf/i.test(error.message)) {
        throw new ApiError(
          'Your security token is missing or expired. Refresh the page and try again.',
          403,
          error.fieldErrors,
          error.nonFieldErrors
        );
      }
      throw error;
    }
    if (response.status === 403) {
      // Django's CSRF middleware returns an HTML 403 rather than JSON.
      throw new ApiError(
        'Your security token is missing or expired. Refresh the page and try again.',
        403
      );
    }
    throw new ApiError(`API returned HTTP ${response.status}.`, response.status);
  }

  if (!isJson) {
    throw new ApiError(
      'API endpoint returned a non-JSON response. Configure VITE_API_BASE_URL to point to the Django REST backend.',
      response.status
    );
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Newline-delimited JSON streaming
//
// `apiRequest` buffers a complete JSON body, so it cannot read the assistant's
// line-delimited stream. This helper mirrors its header handling (bearer token,
// CSRF header, credentialed cookies) and yields each decoded frame as it
// arrives. Pass an AbortSignal to cancel a stream that is no longer needed.
// ---------------------------------------------------------------------------
export async function* streamNdjson<T extends object>(
  url: string,
  body: unknown,
  options?: { signal?: AbortSignal }
): AsyncGenerator<T, void, void> {
  const headers: Record<string, string> = {
    Accept: 'application/x-ndjson',
    'Content-Type': 'application/json',
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const csrf = getCsrfToken();
  if (csrf) {
    headers[CSRF_HEADER_NAME] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      signal: options?.signal,
    });
  } catch {
    // An aborted request is an intentional cancellation, not an error.
    if (options?.signal?.aborted) return;
    throw new ApiError(
      'Unable to reach the Hectic Lab API. Verify VITE_API_BASE_URL and server connectivity.',
      0
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError(
        'You’ve sent several messages quickly. Please wait a moment and try again.',
        429
      );
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      throw parseDrfErrors(data, response.status);
    }
    throw new ApiError(`API returned HTTP ${response.status}.`, response.status);
  }

  if (!response.body) {
    throw new ApiError('The assistant stream could not be read.', response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          try {
            yield JSON.parse(line) as T;
          } catch {
            // Skip a malformed frame rather than aborting the whole stream.
          }
        }
        newlineIndex = buffer.indexOf('\n');
      }
    }

    const leftover = buffer.trim();
    if (leftover) {
      try {
        yield JSON.parse(leftover) as T;
      } catch {
        // Ignore a trailing partial frame.
      }
    }
  } finally {
    reader.releaseLock();
  }
}
