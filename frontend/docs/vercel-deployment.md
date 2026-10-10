# Vercel deployment

The current deployment is a frontend-only demo: set `VITE_DEMO_MODE=true`
in Production and Preview. No backend, database or BACKEND_URL is needed.
The project root is `frontend`; `vercel.json` builds Vercel Build Output API v3.

The workspace opens directly as Demo Creator. Authentication and email
recovery links return to the workspace; no real accounts or emails exist.
Draft CRUD and simulated identity verification persist in browser localStorage.
Media files remain in memory and must be reselected after reload. Simulated
scheduled publication is reconciled when content is loaded, not by a server.
Use fictional information only. Browser data can be cleared or modified;
this is not production authentication, identity verification or paid protection.
Dashboard analytics and uploads are simulated; media is not sent to R2.

## Commands (from frontend)

```powershell
npm ci
npm run lint
npx vitest run --maxWorkers=1
npm run test:deployment
$env:VITE_DEMO_MODE = 'true'
npm run build:vercel
npx vercel --prod
```

Git integration uses Vercel's Production/Preview environment settings.
For CLI deployment of this monorepo use the repository root after linking
it to the same project; Vercel applies the configured `frontend` root.
For an already built demo output, `vercel --prebuilt --prod` from frontend
can deploy the ignored `.vercel/output` directory without rebuilding.

## Checks

Check dashboard, content CRUD, validation, delete confirmation, verification,
simulated publishing and scheduling. Reload content and open routes directly.
Check mobile navigation and horizontal overflow at 375px, 768px and 1440px.
Confirm no `/api` network calls occur. `/api/*` returns 404 in demo deployments.

## Future backend mode

Remove VITE_DEMO_MODE or set it to false, supply BACKEND_URL as a public
HTTPS Spring Boot origin, and redeploy. Set the backend FRONTEND_URL and
CORS_ALLOWED_ORIGINS to the exact frontend HTTPS origin. Secure cookies
remain enabled. API requests proxy before the SPA fallback and are uncached.
Verify remote cookies, login/logout and email flows separately. Keep JWT,
SMTP, database and R2 secrets exclusively on the backend.

Reference: https://vercel.com/docs/build-output-api/configuration
