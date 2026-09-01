# Frontend tech stack

## Runtime / build
- React 18.2 + TypeScript 5.2 (strict)
- Vite 5.2 (`@vitejs/plugin-react`, `vite-tsconfig-paths`)
- Package manager: **npm** (`package-lock.json`); scripts in `package.json`
- Node: local often Node 25.x; lockfile/npm 11 — prefer LTS if CI issues
- Dev server: `127.0.0.1:5173` (`vite.config.ts`)
- Prod build: `tsc && vite build`; minify **terser**; `drop_console`; manualChunks vendor/ui/router

## UI
- Tailwind 3.4 + PostCSS/autoprefixer — palette `primary.*` / `grey.*` in `tailwind.config.js`
- MUI 5 (`@mui/material`, icons) + Emotion
- Headless UI 2 + Heroicons 2
- `tailwind-merge`; charts: recharts 3
- DnD: `@dnd-kit/*` and `react-beautiful-dnd`

## Data / forms / editors
- Axios 1.7 — shared `authedClient`
- react-hook-form; react-hot-toast; lodash (+ debounce)
- date-fns 4; jwt-decode 4; react-cookie 7
- Editor.js (+ header/list/paragraph); ProseMirror packages (rich text experiments/tools)
- i18next 25 + react-i18next 16

## Auth / hosting
- `@react-oauth/google`
- Firebase Hosting (`firebase.json`, `.firebaserc` → `medianne-web`)

## Env (Vite)
Required local: `VITE_GOOGLE_CLIENT_ID`, `VITE_MEDILINK_API_BASE_URL` (`.env` / `.env.local`).
Build-time define also pins `VITE_APP_DOMAIN`, `VITE_APP_WWW_DOMAIN`, `VITE_APP_FIREBASE_URL`.

## Test / lint
- Vitest 4 (+ `@vitest/ui`) — sparse unit tests (e.g. `utils/common.test.ts`)
- ESLint 8 + `@typescript-eslint` + react-hooks + react-refresh (`.eslintrc.cjs`)
- No Prettier config in repo root

## Path aliases (`tsconfig` baseUrl `src`)
`@components/*`, `@utils/*`, `@pages/*`, `@requests/*`, `@models/*`.
Also bare imports from `src` roots: `constants/...`, `context/...`, `hooks/...` (resolved via baseUrl).
