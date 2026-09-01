# Frontend task completion checks

From `frontend/` after meaningful TS/UI changes:

1. **Types** — `npx tsc --noEmit` or full `npm run build` (build runs `tsc && vite build`). Fix strict/unused errors (`noUnusedLocals`/`noUnusedParameters`).
2. **Lint** — `npm run lint` (max-warnings 0). Fix new issues in touched files.
3. **Tests** — if utils/logic changed and tests exist: `npm test` (vitest). Add/extend tests only when behavior is pure and non-UI-critical (pattern: `src/utils/*.test.ts`).
4. **i18n** — any new user-visible copy: both `en.json` and `id.json` keys present.
5. **API contract** — new/changed fields: frontend model + request match backend JSON; smoke via `npm run dev` against running API when endpoint work.
6. **Permissions** — new gated UI: code in `PERMISSIONS` + check via `hasPermission*`; nav visibility consistent.
7. **Deploy path** (only if shipping): `npm run build` produces `dist/index.html`; hosting rewrites already SPA-friendly.

## Minimum bar before “done”
- `npm run lint` clean for change set
- `tsc`/build succeeds
- Manual or automated proof for the user-facing path touched (route renders; request succeeds or mock path still works)

## Out of scope defaults
- No mandatory e2e suite in repo
- Firebase deploy only when user asks or release task
