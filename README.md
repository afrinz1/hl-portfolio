# Hectic Lab Portfolio: Backend

Django + Django REST Framework backend for the Hectic Lab portfolio site. It serves portfolio projects, studio information, services and insights, accepts client inquiries, provides an AI chat assistant, and exposes JWT-authenticated editor endpoints for content management.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Apps & Models](#apps--models)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Database](#database)
- [Testing](#testing)

## Tech Stack

- Django and Django REST Framework
- SimpleJWT (with token blacklist), cookie-based refresh token
- django-cors-headers
- SQLite3 (main database)
- Django cache backend (DB by default, Redis optional) for AI answer caching
- Google Gemini (`google-genai`) for the AI assistant
- Google Analytics Data API (GA4) for live website analytics (optional)
- python-decouple / python-dotenv for environment configuration

## Getting Started

```bash
# apply migrations
python manage.py migrate

# load demo portfolio data (idempotent, safe to re-run)
python manage.py seed_demo_portfolio

# create an editor user (added to the "Editors" group)
python manage.py seed_editor_user --username editor --email editor@hecticlab.com

# run the dev server
python manage.py runserver
```

## Apps & Models

The project has 6 Django apps: `project`, `studio`, `inquiries`, `ai_agent`, `authentication` and `analytics`.

### `BaseClass` (abstract)

Shared by most models.

| Field | Type | Description |
|---|---|---|
| `uuid` | UUIDField (unique, default=uuid.uuid4) | Unique identifier |
| `created_at` | DateTimeField (auto_now_add=True) | Creation timestamp |
| `updated_at` | DateTimeField (auto_now=True) | Last update timestamp |

### `project`

**Category** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `name` | CharField (max_length=250) | Category name |
| `slug` | SlugField (unique) | URL-friendly identifier |
| `description` | TextField (blank) | Category description |
| `display_order` | PositiveIntegerField (default=0) | Sort order |
| `is_active` | BooleanField (default=True) | Visibility flag |

**Project** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `title` | CharField (max_length=200) | Project title |
| `slug` | SlugField (unique) | URL-friendly identifier |
| `category` | ForeignKey → Category (PROTECT, `related_name="projects"`) | Project category |
| `client` | CharField (max_length=150, blank) | Client name |
| `description` | TextField | Project description |
| `cover_image` | URLField (blank) | Cover image URL |
| `year` | PositiveIntegerField | Project year |
| `status` | BooleanField (default=False) | Published status |
| `active_status` | BooleanField (default=True) | Active visibility |
| `display_order` | PositiveIntegerField (default=0) | Sort order |

**ProjectMedia** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `project` | ForeignKey → Project (CASCADE, `related_name="media"`) | Parent project |
| `media_type` | CharField (choices: `image`, `video`; max_length=10) | Media type |
| `media_url` | URLField | Media file URL |
| `public_id` | CharField (max_length=255, blank) | External storage ID |
| `poster_url` | URLField (blank) | Video poster/image URL |
| `caption` | CharField (max_length=255, blank) | Media caption |
| `alt_text` | CharField (max_length=255, blank) | Accessibility alt text |
| `display_order` | PositiveIntegerField (default=0) | Sort order |

### `studio`

**StudioSettings** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `name` | CharField (max_length=150) | Studio name |
| `tagline` | CharField (max_length=255) | Studio tagline |
| `description` | TextField (blank) | Studio description |
| `about` | TextField (blank) | About text |
| `logo_url` | URLField (blank) | Logo URL |
| `email` | EmailField (blank) | Contact email |
| `phone` | CharField (max_length=20, blank) | Contact phone |
| `location` | CharField (max_length=150, blank) | Studio location |
| `vision` | TextField (blank) | Studio vision statement |

**Service** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `title` | CharField (max_length=150) | Service title |
| `slug` | SlugField (unique) | URL-friendly identifier |
| `description` | TextField (blank) | Service description |
| `image_url` | URLField (blank) | Service image URL |
| `display_order` | PositiveIntegerField (default=0) | Sort order |
| `is_active` | BooleanField (default=True) | Visibility flag |

**StudioInsight** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `title` | CharField (max_length=200) | Insight title |
| `summary` | TextField | Insight summary |
| `analysis_data` | JSONField (default=dict, blank) | JSON analysis payload |
| `generated_at` | DateTimeField (auto_now_add=True) | Generation timestamp |
| `is_active` | BooleanField (default=False) | Visibility flag |

### `inquiries`

**Inquiry** (extends BaseClass)

| Field | Type | Description |
|---|---|---|
| `name` | CharField (max_length=150) | Inquirer name |
| `email` | EmailField | Contact email |
| `company` | CharField (max_length=150, blank) | Company name |
| `service` | ForeignKey → Service (SET_NULL, null, blank, `related_name="inquiries"`) | Requested service |
| `budget_range` | CharField (max_length=100, blank) | Budget range |
| `message` | TextField | Inquiry message |
| `status` | CharField (choices: `new`, `contacted`, `in_progress`, `completed`; default `new`) | Inquiry status |

### `ai_agent`

These models do **not** extend `BaseClass`. There is no vector store or embedding model — the former `KnowledgeChunk` model was removed. The assistant builds its context directly from the live portfolio models and caches repeated answers in the Django cache backend.

**ChatSession**

| Field | Type | Description |
|---|---|---|
| `id` | UUIDField (primary key, default=uuid.uuid4) | Session ID |
| `visitor_token` | UUIDField (default=uuid.uuid4) | Anonymous visitor token |
| `is_active` | BooleanField (default=True) | Session active flag |
| `created_at` | DateTimeField (auto_now_add=True) | Creation timestamp |
| `updated_at` | DateTimeField (auto_now=True) | Last update timestamp |

**ChatMessage**

| Field | Type | Description |
|---|---|---|
| `id` | UUIDField (primary key, default=uuid.uuid4) | Message ID |
| `session` | ForeignKey → ChatSession (CASCADE, `related_name="messages"`) | Parent session |
| `role` | CharField (choices: `user`, `assistant`; max_length=10) | Message role |
| `content` | TextField | Message content |
| `question` | TextField (blank) | Cached user question for deduplication |
| `sources` | JSONField (default=list, blank) | Source references |
| `created_at` | DateTimeField (auto_now_add=True) | Creation timestamp |

### `authentication`

No custom models. Uses Django's default `User` model with group-based permissions.

### `analytics`

No models. A read-only app that aggregates portfolio statistics for the `/trust`
dashboard and holds the provider layer for external analytics sources. See
[Statistics](#statistics).

## API Reference

### URL structure

| Root prefix | Includes |
|---|---|
| `admin/` | Django admin |
| `sitemap.xml` | `sitemap_xml` — data-driven sitemap |
| `api/v1/` | `project.v1_urls`, `studio.v1_urls`, `inquiries.v1_urls` |
| `api/` | `project.urls`, `studio.urls`, `inquiries.urls` (legacy, non-paginated) |
| `api/v1/assistant/` | `ai_agent.urls` |
| `api/v1/auth/` | `authentication.urls` |
| `api/v1/analytics/` | `analytics.urls` |

### Projects

| Endpoint | View | Notes |
|---|---|---|
| `GET /api/categories/` | `CategoryListView` | Non-paginated |
| `GET /api/projects/` | `ProjectListView` | Non-paginated, public only |
| `GET /api/projects/<slug>/` | `ProjectDetailView` | Public only |
| `GET /api/projects/<slug>/media/` | `ProjectMediaListView` | Public only |
| `GET /api/v1/categories/` | `V1CategoryListView` | Paginated |
| `GET /api/v1/projects/` | `V1ProjectListView` | Paginated, public only |
| `GET /api/v1/projects/<slug>/` | `ProjectDetailView` | |
| `GET /api/v1/projects/<slug>/media/` | `V1ProjectMediaListView` | Paginated |
| `* /api/v1/media/` | `V1ProjectMediaViewSet` | CRUD, editor only |
| `* /api/v1/editor/projects/` | `EditorProjectViewSet` | CRUD, editor only |
| `* /api/v1/editor/categories/` | `EditorCategoryViewSet` | CRUD, editor only |

### Studio

| Endpoint | View | Notes |
|---|---|---|
| `GET /api/studio/` | `StudioSettingsView` | List |
| `GET /api/services/` | `ServiceListView` | Active only |
| `GET /api/insights/` | `StudioInsightListView` | Active only |
| `GET /api/v1/studio/` | `V1StudioSettingsView` | Paginated |
| `GET /api/v1/services/` | `V1ServiceListView` | Paginated, active only |
| `GET /api/v1/insights/` | `V1StudioInsightListView` | Paginated, active only |

### Inquiries

| Endpoint | View | Notes |
|---|---|---|
| `POST /api/inquiries/` | `InquiryCreateView` | Public (AllowAny) |
| `POST /api/v1/inquiries/` | `InquiryCreateView` | Same as legacy |
| `* /api/v1/editor/inquiries/` | `EditorInquiryViewSet` | CRUD, editor only |

### AI Assistant

| Endpoint | View | Notes |
|---|---|---|
| `POST /api/v1/assistant/chat/` | `PortfolioChatView` | Non-streaming chat |
| `POST /api/v1/assistant/chat/stream/` | `PortfolioChatStreamView` | Streaming chat |

Chat is throttled at `10/minute` (`portfolio_chat` scope).

### Authentication

| Endpoint | View | Notes |
|---|---|---|
| `GET /api/v1/auth/csrf/` | `CsrfTokenView` | Issues CSRF cookie |
| `POST /api/v1/auth/login/` | `LoginView` | JWT login, editor only |
| `POST /api/v1/auth/token/refresh/` | `TokenRefreshView` | Uses HttpOnly cookie |
| `POST /api/v1/auth/logout/` | `LogoutView` | Blacklists token |
| `GET /api/v1/auth/me/` | `MeView` | Returns editor profile |

### Analytics

| Endpoint | View | Notes |
|---|---|---|
| `GET /api/v1/analytics/overview/` | `PortfolioOverviewView` | Public (`AllowAny`); aggregated live from the DB |

Website (GA4) and Instagram analytics are not routed yet — the provider layer is implemented in `analytics/providers.py` (see [Statistics](#statistics)).

### Response shapes

- **Legacy `/api/`** endpoints return JSON arrays directly.
- **V1 `/api/v1/`** list endpoints return paginated objects:

  ```json
  { "count": 0, "next": null, "previous": null, "results": [] }
  ```

- **Detail** views return a single object.
- **Chat** views return structured objects with timing and sources metadata.

### Pagination

`PortfolioPagination` (`portfolio/pagination.py`):

- `page_size = 20`
- `page_size_query_param = "page_size"`
- `max_page_size = 100`

There is no global default pagination; it is applied per view on the v1 endpoints.

## Architecture

### Serializers

| Serializer | Details |
|---|---|
| `CategorySerializer` | `fields = "__all__"` |
| `ProjectSerializer` | Nested `category` (read-only) and `media` (read-only, many) |
| `ProjectWriteSerializer` | Flat serializer for editor operations; auto-generates slugs |
| `ProjectMediaSerializer` | Excludes `project` for public views |
| `ProjectMediaWriteSerializer` | `fields = "__all__"` for editor |
| `StudioSettingsSerializer`, `ServiceSerializer`, `StudioInsightSerializer` | `fields = "__all__"` |
| `InquirySerializer` | Write-only public submission serializer |
| `EditorInquirySerializer` | Full serializer with read-only `service_title` |
| `LoginSerializer` | Username and password fields |

### View patterns

| Use case | Pattern |
|---|---|
| Public read-only | `generics.ListAPIView`, `generics.RetrieveAPIView` (inherit from base `views.py`) |
| V1 paginated | Extend public views with `pagination_class = PortfolioPagination` |
| Editor management | `viewsets.ModelViewSet`, writes restricted to editors |
| Public creation | `generics.CreateAPIView` with `AllowAny` (inquiries) |
| Auth / chat | `APIView` for custom logic |

### Permissions

| Class | Behaviour |
|---|---|
| `IsEditor` | Only users in the "Editors" group, or superusers |
| `EditorMediaPermissions` | Safe methods for all; writes only for editors |
| `DjangoModelPermissionsOrAnonReadOnly` | Default DRF fallback |
| `AllowAny` | Public endpoints (inquiries, auth, chat) |

### Statistics

Portfolio statistics are served by the `analytics` app at
`GET /api/v1/analytics/overview/` (`PortfolioOverviewView`, public). It
aggregates the live `project` tables only and returns `source: "database"`:

- totals — projects, categories, media assets, years covered, year span,
  average media per project
- `category_distribution` — active categories with their public project counts
- `projects_by_month` — a **zero-filled trailing 12-month series** bucketed by
  `Project.created_at` (projects have no release month)
- `media_breakdown` — image vs. video counts
- `selected_work` — up to 6 public projects ordered by `display_order`

`analytics/providers.py` holds the **live provider layer** for the two external
sources the dashboard also displays:

- `website_analytics()` reads the **GA4 Data API** (`GA4_PROPERTY_ID` plus
  service-account credentials). It mirrors the frontend `WebsiteAnalytics`
  interface: period totals, a zero-filled trailing 12-month series, and the most
  viewed project pages.
- `instagram_analytics()` is a placeholder. The Instagram Graph API exposes only
  ~30 days of daily history, fewer than the dashboard's 12-month window, so it
  raises `AnalyticsUnavailable` until metrics are snapshotted over time.

When a provider is unconfigured or unreachable it raises `AnalyticsUnavailable`
rather than inventing figures, and the dashboard falls back to clearly labelled
demo data in the frontend (`src/api/demoAnalytics.ts`).

## Configuration

Defined in `portfolio/settings.py`.

**Installed apps**

- Django core: admin, auth, contenttypes, sessions, messages, staticfiles
- Third-party: `corsheaders`, `rest_framework`, `rest_framework_simplejwt`, `rest_framework_simplejwt.token_blacklist`
- Local: `project`, `studio`, `inquiries`, `authentication.apps.AuthenticationConfig`, `ai_agent`, `analytics`

**REST framework**

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "portfolio_chat": "10/minute",
    },
}
```

**Authentication**

- JWT + session authentication
- Refresh token stored in an HttpOnly cookie (`hectic_refresh_token`)
- Access token lifetime 15 minutes; refresh token 7 days
- Token rotation and blacklisting enabled
- `CSRF_COOKIE_HTTPONLY = False` (readable by the SPA)
- `CSRF_COOKIE_SAMESITE = "Lax"`

**CORS / CSRF**

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.73:3000",
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = same as CORS origins
```

**AI assistant**

- `GEMINI_API_KEY` — required for the chat endpoints.
- `GEMINI_CHAT_MODEL` / `GEMINI_CHAT_FALLBACK_MODEL` — optional model overrides.
  When `GEMINI_CHAT_MODEL` is blank the fastest registered model is selected at
  runtime (Flash → Flash-Lite → Flash → Pro).
- `AI_CHAT_CACHE_ENABLED` (default `True`) / `AI_CHAT_CACHE_TTL_SECONDS`
  (default `300`) — repeated-question answer caching.

**Cache**

```python
CACHES = {
    "default": {
        "BACKEND": config("CACHE_BACKEND", default="django.core.cache.backends.db.DatabaseCache"),
        "LOCATION": config("CACHE_LOCATION", default="ai_chat_cache"),
    }
}
```

Set `CACHE_BACKEND`/`CACHE_LOCATION` to a Redis backend to share the cache
across workers; otherwise the database cache table (`ai_chat_cache`) is used.

**Analytics**

- `GA4_PROPERTY_ID` — GA4 property id for live website analytics.
- `GA4_SERVICE_ACCOUNT_FILE` (or `GA4_SERVICE_ACCOUNT_JSON`, or
  `GOOGLE_APPLICATION_CREDENTIALS`) — GA4 service-account credentials.
- `INSTAGRAM_ACCESS_TOKEN` — reserved for Instagram Insights (not yet served).
- `SITE_URL` — absolute public site origin used to build `sitemap.xml` URLs;
  falls back to the request origin when blank.

**SEO**

- `GET /sitemap.xml` is generated from the static routes plus every published
  project and active category (`portfolio/sitemap.py`).

## Database

- **Engine:** SQLite3 (`db.sqlite3`)
- **AI cache:** Django cache backend — DB table `ai_chat_cache` by default, or Redis via `CACHE_BACKEND`/`CACHE_LOCATION`
- The `analytics` app has no models, so it has no migrations.

**Migrations**

| App | Migrations |
|---|---|
| `project` | 6 (initial through media fields) |
| `studio` | 3 |
| `inquiries` | 3 |
| `ai_agent` | 2 |
| `authentication` | Uses Django auth migrations |

**Seed commands**

- `project/management/commands/seed_demo_portfolio.py`: creates 4 categories (1 inactive) and 10 projects with visibility variations (7 published and active, 1 unpublished, 1 archived, 1 in a hidden category), each with YouTube demo media. Idempotent.
- `authentication/management/commands/seed_editor_user.py`: creates a user in the "Editors" group.

## Testing

Tests live in `project/tests.py`, `studio/tests.py`, `inquiries/tests.py`, `ai_agent/tests.py`, `authentication/tests.py` and `analytics/tests.py`.

```bash
python manage.py test
```

**Project**

- `test_legacy_project_list_keeps_list_shape_and_hides_unpublished`
- `test_v1_project_list_is_paginated`
- `test_project_media_route_only_returns_public_project_media`
- `test_v1_page_size_is_capped`
- `BaseClassTimestampTests`: `created_at` is immutable, `updated_at` changes
- `DemoPortfolioCommandTests`: seed command creates correct counts and visibility

**Services**

- `test_legacy_service_list_only_returns_active_services`
- `test_v1_service_list_is_paginated_and_only_returns_active_services`

**Inquiries**

- `test_submission_creates_inquiry_and_sends_both_emails`
- `test_invalid_submission_does_not_create_inquiry_or_send_email`

**Analytics**

- `test_overview_counts_only_public_portfolio_data`
- `test_overview_returns_chartable_shapes`
- `test_overview_is_publicly_readable`
- `test_overview_handles_an_empty_portfolio`
- `OverviewContractTests.test_overview_payload_has_expected_top_level_keys`
#   h l - p o r t f o l i o  
 