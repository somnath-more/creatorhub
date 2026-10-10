# Frontend authentication

Run the backend using [session setup](../../backend/creatorhub/docs/sessions.md),
then `npm run dev` from frontend. Vite proxies /api to backend port 8080. Login and
registration are public; portal routes require authentication. Production needs
same-origin HTTPS API routing and SPA fallback for direct page links.

AuthProvider subscribes to AuthClient through useSyncExternalStore. It restores
the session once through cookie refresh, with network-error retry. Login returns
to an internal requested route; registration shows success on the login page.
Navigation shows the account and a mobile/desktop sign-out action.

Access tokens live only in memory. HttpOnly refresh cookies are handled by the
browser. Cookie writes first obtain a CSRF cookie and send X-XSRF-TOKEN. Use
`authClient.request('/api/...')` for future protected business APIs: it adds Bearer
authorization, shares one refresh after 401 and retries once. It does not refresh
on 403. Do not use that method for auth endpoints, file streams or requests whose
bodies cannot be replayed; current intended callers use JSON/string request bodies.

Logout blocks new protected requests and waits for pending login/refresh before
revoking the latest cookie. Its network failures preserve the session with retry
feedback. Async responses are checked against a session generation so they cannot
return data into a later account. Multi-tab refresh coordination is not included;
simultaneous cross-tab refresh can require signing in again due to replay detection.

Content and verification progress use authenticated APIs; simulated media in
memory is scoped by account. Account changes remount portal views. Legacy
browser demo data is preserved without automatic migration. Publishing uses
server-owned status and identity gating; analytics remain
explicitly labeled demos. Upload completion is still simulated.

Verify with `npm test`, `npm run lint`, `npm run build`. Tests cover transport and
session races, StrictMode startup, protected redirects, registration validation,
connection recovery, account isolation and existing demo workflows. DOM worker
concurrency is limited to four for reliable developer-machine runs.

Account recovery adds public `/forgot-password`, `/reset-password`, and
`/verify-email` pages. The portal offers verification resend and profile refresh.
Email verification is separate from identity verification. See the backend
[recovery guide](../../backend/creatorhub/docs/account-recovery.md) for local
Mailpit setup, link expiry, session revocation and production SMTP configuration.
