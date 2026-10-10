# CreatorHub frontend

React + TypeScript + Vite + Tailwind. See the [root README](../README.md)
for reviewer setup, demo controls, seeds, persistence and tests.

Run the frontend-only demo in PowerShell:

```powershell
npm ci
$env:VITE_DEMO_MODE = 'true'
npm run dev
```

Without `VITE_DEMO_MODE=true`, repositories use the Spring API. The Vite dev
server proxies `/api` to `http://127.0.0.1:8080`. API setup is documented in
[authentication](docs/authentication.md) and the backend README.

[Vercel deployment](docs/vercel-deployment.md) uses the same explicit demo flag.
No JWT, database, mail or R2 secrets belong in frontend environment variables.
