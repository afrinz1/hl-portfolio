# Hectic Lab Portfolio

A portfolio site for Hectic Lab with a Django REST Framework API and a React/Vite single-page app. The API serves portfolio projects, studio information, services, insights and an analytics dashboard, accepts client inquiries, and exposes an AI assistant backed by Google Gemini. An authenticated editor dashboard lets the studio manage projects, categories, media and inquiries.

## Table of Contents

- [Repository Layout](#repository-layout)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Apps & Models](#apps--models)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [AI Assistant](#ai-assistant)
- [Analytics](#analytics)
- [Email](#email)
- [Frontend Routes](#frontend-routes)
- [Testing](#testing)
- [Deployment](#deployment)

## Repository Layout

```
.
├── portfolio/                 # Django project (backend)
│   ├── portfolio/             # Settings, root urls, sitemap, pagination
│   ├── project/               # Categories, Projects, ProjectMedia
│   ├── studio/                # StudioSettings, Service, StudioInsight
│   ├── inquiries/             # Inquiry + email delivery
│   ├── ai_agent/              # Chat + natural-language project search
│   ├── authentication/        # JWT login, CSRF, editor permissions
│   ├── analytics/             # Portfolio overview + external providers
│   ├── manage.py
│   └── requirements.txt
└── frontend/                  # React + Vite SPA
    ├── src/
    │   ├── api/               # client.ts, hecticApi.ts, types
    │   ├── components/        # UI + analytics sections
    │   ├── pages/             # Route pages
    │   └── App.tsx            # Route table
    ├── vite.config.ts
    └── package.json
```

## Tech Stack

**Backend**

- Django 6.1 and Django REST Framework 3.18
- SimpleJWT (with token blacklist) — access token in memory, refresh token in an HttpOnly cookie
- django-cors-headers
- WhiteNoise (`CompressedManifestStaticFilesStorage`) for static file serving in production
- Google Gemini via `google-genai` for the assistant and project search
- Google Analytics Data API (GA4) for live website analytics (optional)
- Resend HTTPS API for outbound email (Railway blocks outbound SMTP)
- SQLite3 (default) or PostgreSQL via the `DB_LIVE` switch (see [Environment Variables](#environment-variables))
- python-dotenv / python-decouple for environment configuration

**Frontend**

- React 19 + TypeScript, Vite 8, Tailwind CSS 4
- React Router 7, Framer Motion, Recharts, lucide-react

## Getting Started

### Backend

```bash
cd portfolio
pip install -r requirements.txt

python manage.py migrate

# DB-backed cache table used to cache repeated AI answers
python manage.py createcachetable

# load demo portfolio data (idempotent, safe to re-run)
python manage.py seed_demo_portfolio

# create an editor user (added to the "Editors" group)
python manage.py seed_editor_user --username editor --email editor@hecticlab.com

python manage.py runserver
```

The API is then served at `http://127.0.0.1:8000/`. For local development set
`DEBUG=True` in the environment (see [Environment Variables](#environment-variables)).

### Frontend

```bash
cd frontend
npm install
npm run dev            # dev server on http://localhost:3000
```

Copy `.env.example` to `.env` if you need to point the SPA at a non-default API
URL. The Vite dev proxy forwards `/api` to `VITE_API_PROXY_TARGET`
(`http://127.0.0.1:8000` by default) when `VITE_API_BASE_URL` is left empty.

## Environment Variables

Create a `.env` at the repository root (loaded by the backend). Only the
variable **names** are listed here — never commit real values.

**Django**

| Variable | Default | Notes |
|---|---|---|
| `SECRET_KEY` | — | Required |
| `DEBUG` | `False` | Defaults to production mode; set `True` locally |
| `ALLOWED_HOSTS` | `*` | Comma-separated |
| `CSRF_TRUSTED_ORIGINS` | localhost + Vercel origin | Comma-separated; must include the deployed SPA origin |
| `CORS_ALLOWED_ORIGINS` | localhost + Vercel origin | Comma-separated; wildcards are incompatible with credentialed requests |
| `SITE_URL` | `""` | Absolute public origin for `sitemap.xml`; falls back to request origin |
| `JWT_SIGNING_KEY` | `SECRET_KEY` | Optional override |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `15` | |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | |
| `JWT_AUTH_COOKIE` | `hectic_refresh_token` | HttpOnly refresh cookie name |
| `JWT_AUTH_COOKIE_SAMESITE` | `Lax` (dev) / `None` (prod) | `None` required for cross-site Vercel → Railway |
| `CSRF_COOKIE_SAMESITE` | `Lax` (dev) / `None` (prod) | Same rationale as above |
| `SECURE_SSL_REDIRECT` | `not DEBUG` | |
| `USE_X_FORWARDED_HOST` | `not DEBUG` | |

**Database**

| Variable | Notes |
|---|---|
| `DB_LIVE` | `True` switches to PostgreSQL; otherwise SQLite |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection (port defaults to `5432`, `sslmode=require`) |

**AI**

| Variable | Default | Notes |
|---|---|---|
| `GEMINI_API_KEY` | `""` | Required for chat/search |
| `GEMINI_CHAT_MODEL` | `""` | Blank → fastest registered model chosen at runtime |
| `GEMINI_CHAT_FALLBACK_MODEL` | `""` | Optional fallback model |
| `AI_MEDIA_IMAGE_MAX_BYTES` | `8388608` | Max image/poster bytes sent to Gemini |
| `AI_CHAT_CACHE_ENABLED` | `True` | Cache repeated questions |
| `AI_CHAT_CACHE_TTL_SECONDS` | `300` | Cache entry lifetime |
| `CACHE_BACKEND` | `django.core.cache.backends.db.DatabaseCache` | Set a Redis backend to share cache across workers |
| `CACHE_LOCATION` | `ai_chat_cache` | Cache table / Redis location |

**Email**

| Variable | Default | Notes |
|---|---|---|
| `EMAIL_BACKEND` | `inquiries.email_backend.ResendEmailBackend` | Override to switch back to SMTP |
| `RESEND_API_KEY` | `""` | Required for the Resend backend |
| `DEFAULT_FROM_EMAIL` | `onboarding@resend.dev` | Must be a Resend-verified sender |
| `INQUIRY_NOTIFICATION_EMAIL` | `hecticlabs1@gmail.com` | Where notifications land; Reply-To on the client acknowledgement |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_TIMEOUT` | — | SMTP fallback settings |

**Analytics**

| Variable | Notes |
|---|---|
| `GA4_PROPERTY_ID` | GA4 property id for live website analytics |
| `GA4_SERVICE_ACCOUNT_FILE` / `GA4_SERVICE_ACCOUNT_JSON` / `GOOGLE_APPLICATION_CREDENTIALS` | GA4 service-account credentials |
| `INSTAGRAM_ACCESS_TOKEN` | Reserved for Instagram Insights (not served — see [Analytics](#analytics)) |

**Frontend** (`frontend/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | API origin; the client normalises it and appends `/api/v1`. Empty → relative `/api/v1` via the dev proxy |
| `VITE_API_PROXY_TARGET` | Dev-proxy target (default `http://127.0.0.1:8000`) |

Only `VITE_`-prefixed variables reach the browser bundle — never put secrets there.

## Apps & Models

Seven Django apps: `project`, `studio`, `inquiries`, `ai_agent`, `authentication`, `analytics`, plus the `portfolio` project package.

### `BaseClass` (abstract)

Shared by most models.

| Field | Type | Description |
|---|---|---|
| `uuid` | UUIDField (unique, default=uuid.uuid4) | Unique identifier |
| `created_at` | DateTimeField (auto_now_add=True) | Creation timestamp |
| `updated_at` | DateTimeField (auto_now=True) | Last update timestamp |

### `project`

**Category** (extends `BaseClass`) — `name`, `slug` (unique), `description`, `display_order`, `is_active`.

**Project** (extends `BaseClass`) — `title`, `slug` (unique), `category` (FK → Category, `PROTECT`, `related_name="projects"`), `client`, `description`, `cover_image` (URL), `year`, `status` (published flag, default `False`), `active_status` (default `True`), `display_order`. Ordered by `["display_order", "-created_at"]`.

**ProjectMedia** (extends `BaseClass`) — `project` (FK → Project, `CASCADE`, `related_name="media"`), `media_type` (`image` | `video`), `media_url` (URL), `public_id`, `poster_url` (URL), `caption`, `alt_text`, `display_order`. Ordered by `["display_order", "created_at"]`.

A project is **public** only when `status=True`, `active_status=True` and its `category.is_active=True`.

### `studio`

**StudioSettings** (extends `BaseClass`) — `name`, `tagline`, `description`, `about`, `logo_url`, `email`, `phone`, `location`, `vision`.

**Service** (extends `BaseClass`) — `title`, `slug` (unique), `description`, `image_url`, `display_order`, `is_active`.

**StudioInsight** (extends `BaseClass`) — `title`, `summary`, `analysis_data` (JSON, default `{}`), `generated_at` (auto), `is_active` (default `False`). Ordered by `["-generated_at"]`.

### `inquiries`

**Inquiry** (extends `BaseClass`) — `name`, `email`, `company`, `service` (FK → Service, `SET_NULL`, `related_name="inquiries"`), `budget_range`, `message`, `status` (`new` | `contacted` | `in_progress` | `completed`, default `new`). Ordered by `["-created_at"]`.

### `ai_agent`

These models do **not** extend `BaseClass`. There is **no vector database and no embeddings** — the former `KnowledgeChunk` model and the entire chromadb/vector tree were removed. The assistant builds its context directly from the live portfolio models and caches repeated answers in the Django cache backend.

**ChatSession** — `id` (UUID PK), `visitor_token` (UUID), `is_active`, `created_at`, `updated_at`.

**ChatMessage** — `id` (UUID PK), `session` (FK → ChatSession, `CASCADE`, `related_name="messages"`), `role` (`user` | `assistant`), `content`, `question` (cached question for dedup), `sources` (JSON list), `created_at`. Ordered by `["created_at"]`.

### `authentication`

No custom models — Django's default `User` plus a `Editors` group. `user_is_editor()` treats members of that group and superusers as editors.

### `analytics`

No models. A read-only app that aggregates portfolio statistics and holds the provider layer for external analytics sources.

## API Reference

### URL structure

Defined in `portfolio/urls.py`:

| Root prefix | Includes |
|---|---|
| `admin/` | Django admin |
| `sitemap.xml` | Data-driven sitemap (`portfolio/sitemap.py`) |
| `api/v1/` | `project.v1_urls`, `studio.v1_urls`, `inquiries.v1_urls` |
| `api/` | `project.urls`, `studio.urls`, `inquiries.urls` (legacy, non-paginated) |
| `api/v1/assistant/` | `ai_agent.urls` |
| `api/v1/auth/` | `authentication.urls` |
| `api/v1/analytics/` | `analytics.urls` |

The `v1` prefix is the current, supported surface. The unprefixed `api/` routes are the legacy surface kept for backwards compatibility and return plain JSON arrays; `v1` list endpoints are paginated.

### Projects

| Endpoint | Notes |
|---|---|
| `GET /api/v1/categories/` | Paginated, active only |
| `GET /api/v1/projects/` | Paginated, public only |
| `GET /api/v1/projects/<slug>/` | Public detail |
| `GET /api/v1/projects/<slug>/media/` | Paginated media for a public project |
| `* /api/v1/media/` | CRUD (safe methods public, writes editor-only); supports `?project=<id>` |
| `* /api/v1/editor/projects/` | Editor-only CRUD (lookup by slug or numeric id) |
| `* /api/v1/editor/categories/` | Editor-only CRUD |
| `GET /api/categories/`, `GET /api/projects/`, `GET /api/projects/<slug>/`, `GET /api/projects/<slug>/media/` | Legacy non-paginated equivalents |

### Studio

| Endpoint | Notes |
|---|---|
| `GET /api/v1/studio/` | Studio settings |
| `GET /api/v1/services/` | Active only |
| `GET /api/v1/insights/` | Active only |
| `GET /api/studio/`, `GET /api/services/`, `GET /api/insights/` | Legacy non-paginated equivalents |

### Inquiries

| Endpoint | Notes |
|---|---|
| `POST /api/v1/inquiries/` | Public (`AllowAny`) |
| `POST /api/inquiries/` | Legacy, same behaviour |
| `* /api/v1/editor/inquiries/` | Editor-only CRUD |

### Analytics

| Endpoint | Notes |
|---|---|
| `GET /api/v1/analytics/overview/` | Public (`AllowAny`); aggregated live from the DB |

Website (GA4) and Instagram figures are not routed as endpoints — the provider layer lives in `analytics/providers.py` (see [Analytics](#analytics)).

### Pagination

`PortfolioPagination` (`portfolio/pagination.py`), applied per view on the `v1` list endpoints:

- `page_size = 20`
- `page_size_query_param = "page_size"`
- `max_page_size = 100`

There is no global default pagination. `v1` list responses have the shape
`{ "count": N, "next": null, "previous": null, "results": [...] }` — **`count`
is the total matching rows, not the size of `results`**. Clients that need the
full set must walk `next` (the editor dashboard does this).

### Renderers

`DEFAULT_RENDERER_CLASSES` is JSON-only when `DEBUG=False`. The browsable HTML
API (and its DRF static assets) is enabled only in development — this avoids a
production 500 from WhiteNoise's manifest missing DRF's CSS, and removes a
public information-disclosure surface.

## Authentication

JWT + session authentication. The **access token** lives in memory in the SPA
only (15 minutes); the **refresh token** is stored in an HttpOnly cookie
(`hectic_refresh_token`, 7 days) with rotation and blacklisting enabled.

| Endpoint | Notes |
|---|---|
| `GET /api/v1/auth/csrf/` | Issues the readable `csrftoken` cookie (and returns it in the body) |
| `POST /api/v1/auth/login/` | Username/password; editor-only; sets the refresh cookie, returns access token + CSRF token |
| `POST /api/v1/auth/token/refresh/` | Reads the refresh cookie, returns a new access token |
| `POST /api/v1/auth/logout/` | Blacklists the refresh token and clears the cookie |
| `GET /api/v1/auth/me/` | Returns the editor profile |

Flow: the SPA fetches the CSRF cookie, echoes it back in the `X-CSRFToken`
header on unsafe methods, sends `credentials: 'include'` on every request, and
silently retries once via `/auth/token/refresh/` on a `401`. Cookies are
`SameSite=Lax` in development (same site, different port) and `SameSite=None`
+ `Secure` in production, because the SPA (Vercel) and API (Railway) live on
different sites.

## AI Assistant

Two Gemini-backed, publicly accessible endpoints. Both are `AllowAny` and
throttled with `ScopedRateThrottle`.

| Endpoint | Throttle | Notes |
|---|---|---|
| `POST /api/v1/assistant/chat/` | `10/minute` (`portfolio_chat`) | Non-streaming chat |
| `GET /api/v1/assistant/search/?query=<text>` | `30/minute` (`portfolio_search`) | Natural-language project search |

The **chat** endpoint is deliberately non-streaming: it returns a single JSON
object `{ session_id, visitor_token, answer, sources, timing }`. A session is
created on first call; subsequent calls pass `session_id` and `visitor_token`
so history (up to the last 10 turns) is reused. `sources` are project cards for
the retrieved context. When `GEMINI_CHAT_MODEL` is blank the fastest registered
model is selected at runtime (Flash → Flash-Lite → Pro ladder).

The **search** endpoint ranks published projects against a free-text query and
returns `{ query, count, results }` of project cards.

Context is built directly from the live portfolio models — no retrieval
index. Repeated questions are served from the Django cache backend
(`AI_CHAT_CACHE_ENABLED`, `AI_CHAT_CACHE_TTL_SECONDS`). Provider failures are
mapped to `503` (`AI_PROVIDER_UNAVAILABLE`, retryable, `Retry-After: 5`) or
`502` (`AI_PROVIDER_ERROR`).

## Analytics

`GET /api/v1/analytics/overview/` (`PortfolioOverviewView`, public) aggregates
the live `project` tables only and returns `source: "database"`:

- **totals** — projects, categories, media assets, years covered, year span, average media per project
- **category_distribution** — active categories with their public project counts
- **projects_by_month** — a zero-filled trailing 12-month series bucketed by `Project.created_at` (projects have no release month)
- **media_breakdown** — image vs. video counts
- **selected_work** — up to 6 public projects ordered by `display_order`

`analytics/providers.py` holds the provider layer for the two external sources
the `/trust` dashboard also displays:

- **`website_analytics()`** reads the **GA4 Data API** (`GA4_PROPERTY_ID` + service-account credentials). It mirrors the frontend `WebsiteAnalytics` interface: period totals, a zero-filled trailing 12-month series, and the most viewed project pages.
- **`instagram_analytics()`** is a placeholder. The Instagram Graph API exposes only ~30 days of daily history, fewer than the dashboard's 12-month window, so it raises `AnalyticsUnavailable`.

When a provider is unconfigured or unreachable it raises `AnalyticsUnavailable`
rather than inventing figures, and the `/trust` dashboard falls back to clearly
labelled demo values in `frontend/src/api/demoAnalytics.ts`. Its interfaces
mirror the GA4 and Instagram Graph API shapes, so a real source can replace them
without UI changes.

**Live vs. demo split:** all portfolio figures on the site are fetched live from
the API with **no demo fallback**. Only the Website (GA4) and Instagram figures
on `/trust` use labelled demo data today.

## Email

Inquiries are persisted first, then two best-effort notifications are sent
(`inquiries/utils.py`): a **client acknowledgement** to the submitter and an
**admin notification** to the studio inbox. A mail failure is logged but never
fails the submission. When the active backend is not configured, sending is
skipped rather than attempted.

Because Railway blocks outbound SMTP (it drops the packets, so an SMTP send
hangs instead of failing), mail goes out over Resend's HTTPS API
(`inquiries/email_backend.py`, port 443). The SMTP settings are retained so the
transport can be switched back with env vars alone once a plan allows SMTP.

## Frontend Routes

Defined in `frontend/src/App.tsx`:

| Route | Page |
|---|---|
| `/` | Home |
| `/work` | Work index |
| `/categories`, `/categories/:slug` | Categories and category projects |
| `/projects/:slug` | Project detail |
| `/studio` | Studio (services anchor at `/studio#services`) |
| `/services` | Redirects to `/studio#services` |
| `/inquiries` | Inquiry form |
| `/privacy` | Privacy |
| `/trust` | Studio Analytics Dashboard |
| `/login` | Editor login |
| `/editor/login` | Redirects to `/login` |
| `/editor`, `/editor/*` | Editor dashboard (protected) |
| `*` | Not found |

SEO titles are set from `ROUTE_META`; the AI chatbot widget renders globally.
`GET /sitemap.xml` is generated on the backend from the static routes plus every
published project and active category.

## Testing

Backend tests live alongside each app (`project/tests.py`, `studio/tests.py`,
`inquiries/tests.py`, `ai_agent/tests.py`, `authentication/tests.py`,
`analytics/tests.py`).

```bash
cd portfolio
python manage.py test
```

Coverage includes: legacy list shape + hidden-project filtering, `v1`
pagination and `page_size` capping, public-only media routes, `BaseClass`
timestamp semantics, the demo seed command, active-service filtering, inquiry
creation + email dispatch, and analytics overview contract/shape/empty cases.

Frontend checks:

```bash
cd frontend
npm run lint     # tsc --noEmit
npm run build    # production bundle in dist/
npm run clean    # remove dist/
```

## Deployment

**Backend — Railway**

1. Set the environment variables above (`DEBUG=False`, `SECRET_KEY`,
   `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `SITE_URL`,
   `DB_LIVE` + `DB_*`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `SECRET_KEY`-derived
   JWT settings, etc.).
2. Run migrations and collect static files on release:
   `python manage.py migrate --noinput && python manage.py collectstatic --noinput`.
3. Served by gunicorn; WhiteNoise serves the collected static files
   (`STATIC_ROOT = staticfiles/`).

**Frontend — Vercel**

Set `VITE_API_BASE_URL` to the Railway origin (Vite bakes env vars in at build
time, so redeploy after changing it), then build with `npm run build`.

**Cross-site notes:** with the SPA and API on different origins, the API must
list the SPA origin in both `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`,
and the CSRF/refresh cookies must be `SameSite=None; Secure` (the
`DEBUG=False` default).
