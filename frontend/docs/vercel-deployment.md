# Vercel frontend deployment

React runs on Vercel; Spring Boot and PostgreSQL run separately on EC2.
Set the Vercel project Root Directory to `frontend`. This directory's
`vercel.json` selects the custom build, using Vercel Build Output API v3.
No Java service or database is deployed to Vercel.

## Configuration

Set `BACKEND_URL` in Vercel to the public HTTPS backend origin, for example
`https://api.your-domain.com`. Do not include `/api`. Set it for Production
and, if needed, Preview. Builds intentionally fail when this is absent.
It is a build-time setting: changes require a redeployment.

The generated routing config proxies `/api` to Spring Boot before the SPA
fallback. Browser requests remain same-origin, supporting the existing
HttpOnly refresh cookie and readable CSRF cookie. API responses must never
be cached. Missing bundled assets return 404 instead of HTML. Direct links
such as `/content/new`, `/login`, and `/verification` serve the SPA.

On the backend set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the exact
production frontend HTTPS origin. Keep secure cookies enabled. Preview
deployments require their own explicitly allowed origin; use a separate
test backend and data when possible. Keep JWT, database, SMTP and R2 secrets
on EC2; never put them in a `VITE_` variable or frontend deployment.

## Deploy from PowerShell

From `frontend`:

```powershell
npm ci
npm test
npm run test:deployment
npm run lint
$env:BACKEND_URL = 'https://api.your-domain.com'
npm run build:vercel
npx vercel login
npx vercel link
npx vercel env add BACKEND_URL production
npx vercel --prod
```

Choose your own Vercel account/team and project when linking. For Git
integration import this repository, select root `frontend`, configure the
environment, and use the merged production branch. Review previews before
promoting them. Do not deploy a local placeholder backend URL.

## Release checks

- Open and refresh login, registration, password recovery, verification,
  dashboard and content detail/edit routes directly.
- Register/login, reload (refresh cookie), create/edit/delete a draft,
  verify publishing is denied before identity verification, then logout.
- Confirm `/api/auth/csrf` returns JSON and sets the CSRF cookie on the
  frontend host. Confirm refresh/logout cookies and CSRF headers work
  through the deployed proxy, and API errors retain their HTTP status.
- Check at 375px, 768px and 1440px; inspect console/network errors.
- Test reset/verification email links from the real frontend domain.

Frontend regression tests do not prove the remote API, cookies, email or
responsive deployed UI works. Complete these checks against the live
backend before describing the deployment as fully functional. Actual
R2 upload/transcoding/playback remains a separate implementation milestone.

Reference: https://vercel.com/docs/build-output-api/configuration
