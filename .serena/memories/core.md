# Medianne frontend (auth-client)

React/TS SPA for clinic ops: patients, visits, journey kanban, clinical notes (anamnesa/diagnosis/procedure), inventory, recall, staff/RBAC, odontogram. npm package name still `auth-client`. Path: workspace `frontend/`; sibling API `backend/` (separate git).

## Source map
- `src/main.tsx` — BrowserRouter, GoogleOAuthProvider, i18n, Toaster
- `src/App.tsx` — ModalProvider, DomainRedirect, lazy DefaultLayout, global Modal + ApiErrorReportModal
- `src/layout/DefaultLayout.tsx` — shell + **all page Routes**
- `src/pages/` — route-level screens
- `src/components/` — UI (incl. `editorjs-plugins/` odontogram, `compensation/` live payroll)
- `src/requests/` — Axios API calls (authed)
- `src/models/` — TS types ↔ backend JSON (snake_case)
- `src/constants/` — API path prefixes, PERMISSIONS, staff roles, shared consts
- `src/utils/` — `apiClient`, auth/token storage, permissions, domain, toasts, errors
- `src/context/` — ModalContext. `CompensationMockContext` is leftover; payroll screens do not use it
- `src/hooks/` — auth state, journey boards cache, drawer/modal helpers
- `src/i18n/` — i18next `en`/`id` JSON; default+fallback `id`
- `src/config/domain.ts` — medianne.id / Firebase host helpers
- `src/modalRoutes.tsx`, `modalRegistry.tsx` — path→lazy modal components
- `src/mocks/` — compensation mock data
- `source-example/` — static HTML refs (e-Puskesmas); not app runtime
- `docs/` — notes; deploy via `deploy.sh` + Firebase

## Data flow
UI → `requests/*` → `authedClient` (`VITE_MEDILINK_API_BASE_URL`) → backend `/v1/*`.
Models must match backend JSON tags. Path constants in `constants/constants.tsx`.

## Routing (app paths, no `/v1`)
Public: `/login`, `/token-expired`.
Protected (wrap `ProtectedRoute`): `/`→`/institution`, `/patient`, `/patient-detail/:uuid`, `/patient-registration`, `/patient-visit/:id` (+ `/diagnosis`), `/encounter/:id`, `/journey-board/:boardID`, `/inventory`, `/product-replenishment`, `/recall`, `/staff`, `/payroll` (nested in `pages/Compensation.tsx`), `/compensation/*` redirects to `/payroll`, `/forbidden`, `*` NotFound.

## Auth invariants
- Google OAuth (`@react-oauth/google` + `VITE_GOOGLE_CLIENT_ID`)
- JWT + refresh in **sessionStorage**: keys `medilink_token_key`, `medilink_user`, `medilink_refresh_token` (`constants/constants.tsx`)
- `authedClient` Bearer from sessionStorage; 401 refresh via `tokenExpiration`; non-401 4xx → ApiErrorReport modal
- `administrator` role bypasses permission checks (`utils/permissions.ts`)

## Feature notes
- **Payroll** (`/payroll`, `/compensation/*` redirects): live API. Wage settings: `mem:compensation/wages`
- **Journey board**: kanban (`@dnd-kit` / beautiful-dnd), boards from hooks + API
- **Visit clinical**: Editor.js + custom odontogram tools under `components/editorjs-plugins/`
- **Modals**: stack via ModalContext; visit detail also openable as modal via registry

## Deploy
Firebase Hosting project `medianne-web`; domains `medianne.id` / `www.medianne.id` / `medianne-web.web.app`. CI: `.github/workflows/firebase-hosting-*.yml` on `main` + PRs.

## Related
Stack: `mem:tech_stack`. Commands: `mem:suggested_commands`. Style: `mem:conventions`. Done checks: `mem:task_completion`.
