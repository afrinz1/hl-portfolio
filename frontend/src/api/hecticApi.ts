import { apiRequest, attemptTokenRefresh, buildApiUrl, clearAccessToken, resolveMediaUrl, setAccessToken, setCsrfToken } from './client';
import {
  DEMO_CATEGORIES,
  DEMO_INSIGHTS,
  DEMO_PROJECTS,
  DEMO_SERVICES,
  DEMO_STUDIO,
  DEMO_WORK_CATEGORIES,
  filterDemoWorkProjects,
  paginateDemo,
} from './demoData';
import type {
  AuthUser,
  Category,
  EditorInquiry,
  EditorMediaPayload,
  EditorProjectPayload,
  InquiryPayload,
  InquiryResponse,
  Insight,
  LoginPayload,
  PaginatedResponse,
  PortfolioOverview,
  Project,
  ProjectMedia,
  Service,
  StudioInfo,
} from './types';

function assertPaginated<T>(data: PaginatedResponse<T>): PaginatedResponse<T> {
  if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
    throw new Error('Expected paginated DRF response containing results.');
  }
  return {
    count: typeof data.count === 'number' ? data.count : data.results.length,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: data.results,
  };
}

async function withDemoFallback<T>(
  fetcher: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await fetcher();
  } catch {
    return fallback();
  }
}

export const hecticApi = {
  async getCategories(params?: { page?: number }): Promise<PaginatedResponse<Category>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/categories/', params);
        const data = await apiRequest<PaginatedResponse<Category>>(url);
        return assertPaginated(data);
      },
      () => paginateDemo(DEMO_CATEGORIES, params?.page ?? 1)
    );
  },

  async getProjects(params?: {
    page?: number;
    category?: string | number;
  }): Promise<PaginatedResponse<Project>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/projects/', params);
        const data = await apiRequest<PaginatedResponse<Project>>(url);
        return assertPaginated(data);
      },
      () => {
        const filtered = params?.category
          ? DEMO_PROJECTS.filter((p) => {
              const slug = getProjectCategorySlug(p);
              return slug === String(params.category);
            })
          : DEMO_PROJECTS;
        return paginateDemo(filtered, params?.page ?? 1);
      }
    );
  },

  async getProjectBySlug(slug: string): Promise<Project> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl(`/projects/${encodeURIComponent(slug)}/`);
        return apiRequest<Project>(url);
      },
      () => {
        const match = DEMO_PROJECTS.find((p) => p.slug === slug);
        if (!match) {
          throw new Error('Project not found.');
        }
        return match;
      }
    );
  },

  async getProjectMedia(
    slug: string,
    params?: { page?: number }
  ): Promise<PaginatedResponse<ProjectMedia>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl(`/projects/${encodeURIComponent(slug)}/media/`, params);
        const data = await apiRequest<PaginatedResponse<ProjectMedia>>(url);
        return assertPaginated(data);
      },
      () => {
        const match = DEMO_PROJECTS.find((p) => p.slug === slug);
        const items: ProjectMedia[] = match?.thumbnail
          ? [
              {
                id: `${match.id}-still`,
                caption: `${match.title} — Production Still`,
                media_type: 'image',
                image: match.thumbnail,
              },
            ]
          : [];
        return paginateDemo(items, params?.page ?? 1);
      }
    );
  },

  async getStudioInfo(params?: { page?: number }): Promise<PaginatedResponse<StudioInfo>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/studio/', params);
        const data = await apiRequest<PaginatedResponse<StudioInfo>>(url);
        return assertPaginated(data);
      },
      () => paginateDemo([DEMO_STUDIO], params?.page ?? 1)
    );
  },

  async getServices(params?: { page?: number }): Promise<PaginatedResponse<Service>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/services/', params);
        const data = await apiRequest<PaginatedResponse<Service>>(url);
        return assertPaginated(data);
      },
      () => paginateDemo(DEMO_SERVICES, params?.page ?? 1)
    );
  },

  async getInsights(params?: { page?: number }): Promise<PaginatedResponse<Insight>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/insights/', params);
        const data = await apiRequest<PaginatedResponse<Insight>>(url);
        return assertPaginated(data);
      },
      () => paginateDemo(DEMO_INSIGHTS, params?.page ?? 1)
    );
  },

  async getWorkCategories(params?: { page?: number }): Promise<PaginatedResponse<Category>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/categories/', params);
        const data = await apiRequest<PaginatedResponse<Category>>(url);
        return assertPaginated(data);
      },
      () => paginateDemo(DEMO_WORK_CATEGORIES, params?.page ?? 1)
    );
  },

  async getWorkProjects(params?: {
    page?: number;
    category?: string | number;
  }): Promise<PaginatedResponse<Project>> {
    return withDemoFallback(
      async () => {
        const url = buildApiUrl('/projects/', params);
        const data = await apiRequest<PaginatedResponse<Project>>(url);
        return assertPaginated(data);
      },
      () =>
        paginateDemo(
          filterDemoWorkProjects(
            params?.category ? String(params.category) : null
          ),
          params?.page ?? 1
        )
    );
  },

  /**
   * Natural-language project search.
   *
   * The visitor's own words are sent to the backend, where Gemini ranks the
   * published projects against them. No demo fallback: an imaginary match is
   * worse than an honest error.
   */
  async searchProjects(query: string): Promise<Project[]> {
    const url = buildApiUrl('/assistant/search/', { query });
    const data = await apiRequest<{ query: string; count: number; results: Project[] }>(
      url
    );
    return Array.isArray(data?.results) ? data.results : [];
  },

  // ----------------------------------------------------
  // Analytics
  // ----------------------------------------------------
  /**
   * Portfolio statistics aggregated from the live database.
   *
   * Deliberately has no demo fallback: these figures must reflect the real
   * portfolio, so a failure surfaces as an error state rather than silently
   * showing invented numbers. Website and Instagram metrics are demo data and
   * live in `demoAnalytics.ts`.
   */
  async getAnalyticsOverview(): Promise<PortfolioOverview> {
    const url = buildApiUrl('/analytics/overview/');
    return apiRequest<PortfolioOverview>(url);
  },

  async submitInquiry(payload: InquiryPayload): Promise<InquiryResponse> {
    const url = buildApiUrl('/inquiries/');
    return apiRequest<InquiryResponse>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ----------------------------------------------------
  // Authentication & Editor Endpoints
  // ----------------------------------------------------

  async getCsrf(): Promise<{ detail: string; csrfToken: string }> {
    const url = buildApiUrl('/auth/csrf/');
    const res = await apiRequest<{ detail: string; csrfToken: string }>(url);
    if (res?.csrfToken) {
      setCsrfToken(res.csrfToken);
    }
    return res;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    // Ensure fresh CSRF cookie before authenticating
    await this.getCsrf().catch(() => null);

    const url = buildApiUrl('/auth/login/');
    const user = await apiRequest<AuthUser>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      // A 401 here is bad credentials, not an expired session — don't let the
      // silent-refresh flow swallow the real error message.
      skipAuthRefresh: true,
    });

    // Keep the returned access token + CSRF token so subsequent editor
    // requests are authenticated immediately (the refresh cookie remains the
    // source of truth for renewal).
    setAccessToken(user?.access ?? null);
    if (user?.csrfToken) {
      setCsrfToken(user.csrfToken);
    }
    return user;
  },

  async logout(): Promise<void> {
    const url = buildApiUrl('/auth/logout/');
    try {
      await apiRequest<void>(url, { method: 'POST' });
    } finally {
      setCsrfToken(null);
    }
  },

  async getMe(): Promise<AuthUser> {
    const url = buildApiUrl('/auth/me/');
    const user = await apiRequest<AuthUser>(url);
    if (user?.csrfToken) {
      setCsrfToken(user.csrfToken);
    }
    return user;
  },

  async getEditorProjects(params?: { page?: number }): Promise<PaginatedResponse<Project>> {
    const url = buildApiUrl('/editor/projects/', params);
    const data = await apiRequest<PaginatedResponse<Project>>(url);
    return assertPaginated(data);
  },

  async createProject(payload: EditorProjectPayload): Promise<Project> {
    const url = buildApiUrl('/editor/projects/');
    return apiRequest<Project>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProject(
    slugOrId: string | number,
    payload: Partial<EditorProjectPayload>
  ): Promise<Project> {
    const url = buildApiUrl(`/editor/projects/${encodeURIComponent(String(slugOrId))}/`);
    return apiRequest<Project>(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteProject(slugOrId: string | number): Promise<void> {
    const url = buildApiUrl(`/editor/projects/${encodeURIComponent(String(slugOrId))}/`);
    return apiRequest<void>(url, {
      method: 'DELETE',
    });
  },

  async getEditorCategories(params?: { page?: number }): Promise<PaginatedResponse<Category>> {
    const url = buildApiUrl('/editor/categories/', params);
    const data = await apiRequest<PaginatedResponse<Category>>(url);
    return assertPaginated(data);
  },

  async getEditorMedia(params?: {
    page?: number;
    project?: string | number;
  }): Promise<PaginatedResponse<ProjectMedia>> {
    const url = buildApiUrl('/media/', params);
    const data = await apiRequest<PaginatedResponse<ProjectMedia>>(url);
    return assertPaginated(data);
  },

  async createMedia(payload: EditorMediaPayload): Promise<ProjectMedia> {
    const url = buildApiUrl('/media/');
    return apiRequest<ProjectMedia>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMedia(
    id: string | number,
    payload: Partial<EditorMediaPayload>
  ): Promise<ProjectMedia> {
    const url = buildApiUrl(`/media/${encodeURIComponent(String(id))}/`);
    return apiRequest<ProjectMedia>(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteMedia(id: string | number): Promise<void> {
    const url = buildApiUrl(`/media/${encodeURIComponent(String(id))}/`);
    return apiRequest<void>(url, {
      method: 'DELETE',
    });
  },

  async getEditorInquiries(params?: { page?: number }): Promise<PaginatedResponse<EditorInquiry>> {
    const url = buildApiUrl('/editor/inquiries/', params);
    const data = await apiRequest<PaginatedResponse<EditorInquiry>>(url);
    return assertPaginated(data);
  },

  async updateInquiryStatus(
    id: string | number,
    status: string
  ): Promise<EditorInquiry> {
    const url = buildApiUrl(`/editor/inquiries/${encodeURIComponent(String(id))}/`);
    return apiRequest<EditorInquiry>(url, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export function getCategoryImage(category: Category): string | null {
  return resolveMediaUrl(
    category.image || category.cover_image || category.thumbnail || category.cover || null
  );
}

export function getProjectThumbnail(project: Project): string | null {
  return resolveMediaUrl(project.thumbnail || project.cover_image || project.image || null);
}

export function getProjectVideo(project: Project): string | null {
  return resolveMediaUrl(project.video || project.video_url || project.primary_video || null);
}

export function getProjectCategoryName(project: Project): string {
  if (project.category_name) return project.category_name;
  if (project.category && typeof project.category === 'object' && project.category.name) {
    return project.category.name;
  }
  if (typeof project.category === 'string') return project.category;
  return 'Work';
}

export function getProjectCategorySlug(project: Project): string | null {
  if (project.category_slug) return project.category_slug;
  if (project.category && typeof project.category === 'object' && project.category.slug) {
    return project.category.slug;
  }
  return null;
}

export function getMediaSource(item: ProjectMedia): string | null {
  return resolveMediaUrl(item.file || item.url || item.video_url || item.video || item.image || null);
}

export function isMediaVideo(item: ProjectMedia): boolean {
  const kind = (item.media_type || item.type || '').toLowerCase();
  if (kind.includes('video')) return true;
  if (kind.includes('image') || kind.includes('photo')) return false;
  const src = getMediaSource(item) ?? '';
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
}
