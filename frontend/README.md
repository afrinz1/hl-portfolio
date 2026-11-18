# Hectic Lab Frontend

React, TypeScript, Vite, and Tailwind CSS frontend for the Hectic Lab portfolio.
The Django REST API serves data and handles AI assistant requests.

## Local development

1. Install dependencies with `npm install`.
2. Optionally copy `.env.example` to `.env.local` and configure the API URL.
   The Vite development proxy defaults to `http://127.0.0.1:8000`.
3. Start the frontend with `npm run dev`.

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/work` | Work index |
| `/categories`, `/categories/:slug` | Categories, category projects |
| `/projects/:slug` | Project detail |
| `/studio` | Studio |
| `/inquiries` | Inquiry form |
| `/privacy` | Privacy |
| `/trust` | Studio Analytics Dashboard |
| `/login`, `/editor` | Editor login and dashboard |

Navigation order is Home, Work, Trust, Studio + Services.

## Analytics data sources

The `/trust` dashboard (`src/pages/TrustPage.tsx`, sections under
`src/components/analytics/`) mixes two data sources, deliberately kept separate:

- **Portfolio** figures are fetched live from `GET /api/v1/analytics/overview/`
  (`src/api/hecticApi.ts`) with no demo fallback.
- **Website** (GA4) and **Instagram** figures use realistic demo values in
  `src/api/demoAnalytics.ts`, whose interfaces mirror the GA4 and Instagram
  Graph API shapes so a real data source can replace them without UI changes.
  The backend provider layer for these lives in `portfolio/analytics/providers.py`.

## Checks

- `npm run lint` runs the TypeScript check.
- `npm run build` creates the production bundle in `dist/`.
- `npm run clean` removes the `dist/` folder.
