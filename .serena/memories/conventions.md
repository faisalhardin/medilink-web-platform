# Frontend conventions

## Layout of changes (full-stack)
New API surface: backend first, then `models/` types (JSON snake_case exact), `constants` path if needed, `requests/*` via `authedClient`, then pages/components. Keep TS interfaces aligned with Go `json` tags.

## File roles
- `pages/` — route screens only; heavy UI in `components/`
- `requests/` — HTTP only; return `response.data.data` (CommonResponse envelope)
- `models/` — interfaces/types; often `.tsx` even without JSX (legacy)
- Prefer `@components|@pages|@requests|@models|@utils` aliases; `constants/`, `hooks/`, `context/` via baseUrl

## API client
- Authed calls: `import authedClient from '@utils/apiClient'`
- Paths: compose from `constants/constants.tsx` (`/v1/...`), not hardcode base URL in requests
- Auth endpoints may use raw `axios` + `AUTH_URL` (see `requests/authentication.tsx`)
- Idempotent POSTs: header `Idempotency-Key` where backend requires (e.g. patient register)
- `withCredentials: true` common on patient/visit calls

## Auth / storage
- Read token/user from **sessionStorage** keys in constants — do not invent new key names
- `storeAuthentication` decodes JWT and stores `payload` as `MEDILINK_USER`
- Permission codes only via `PERMISSIONS` in `constants/permissions.ts` + `hasPermission` / `hasStaffPermission`
- Gate nav/actions with permissions; `administrator` role = full access

## UI patterns
- Protected pages: wrap in `ProtectedRoute` inside `DefaultLayout` routes
- Overlays: `useModal` / ModalContext stack; register path-based modals in `modalRegistry` if deep-linkable
- User strings: `useTranslation()`; add keys to **both** `i18n/locales/en.json` and `id.json`; default lang `id`
- Toasts: project toast helpers / react-hot-toast — not ad-hoc alerts
- Styling: Tailwind utility-first; brand colors `primary-*` / `grey-*`; MUI where already used
- Tailwind `content` globs only components/layout/pages — new roots may need `tailwind.config.js` update or classes purged

## Domain-specific
- Compensation feature is **mock** until backend exists — keep under `mocks/` + `CompensationMockContext`
- Odontogram: prefer existing `editorjs-plugins` pipeline (normalizer/event generator/codes) over one-off tooth UI
- Visit notes dirty-state: follow existing save bar / UnsavedNotesModal patterns

## Anti-patterns
- Don’t put long-lived secrets in code; Vite only exposes `VITE_*`
- Don’t assume localStorage for JWT (mixed legacy helpers exist — sessionStorage is source of truth for API)
- Don’t add `/v1` on React Router paths
