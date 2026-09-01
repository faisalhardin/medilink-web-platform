# Frontend commands (Darwin)

Cwd: workspace `frontend/` (own git root).

## Install / run
```bash
npm ci                 # lockfile install (CI/deploy)
npm install            # local dep changes
npm run dev            # Vite http://127.0.0.1:5173
npm run build          # tsc + vite build → dist/
npm run preview        # serve dist
```

## Quality
```bash
npm run lint           # eslint ts/tsx, max-warnings 0
npm test               # vitest
npm run test:ui        # vitest UI
```

## Deploy
```bash
./deploy.sh            # npm ci + build + firebase deploy --only hosting
# needs: firebase-tools logged in; firebase.json present
firebase deploy --only hosting
```

## Env
Copy/edit `.env` or `.env.local` with `VITE_GOOGLE_CLIENT_ID`, `VITE_MEDILINK_API_BASE_URL` pointing at local/staging API.

## Serena
```bash
serena memories check  # from frontend root after memory edits
```

## Notes
- Package name in npm is still `auth-client`.
- Backend API is separate process under workspace `backend/` — not started by frontend scripts.
