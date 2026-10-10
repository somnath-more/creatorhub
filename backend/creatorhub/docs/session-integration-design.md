# Refresh sessions and frontend authentication

Status: approved and implemented. Builds on merged authentication PR #10.

## Outcome and scope

Creators can register, sign in, reload without losing their session, access the
protected portal, and sign out. Expired access tokens refresh automatically.
Follow the existing controller -> service -> service.impl -> repository -> model
layers and existing React component patterns. Password reset, email verification,
backend content CRUD and server-enforced publishing remain the following two PRs.

## Session model

Add Flyway V3 with auth_sessions and refresh_tokens tables. A session belongs to
one user, has an absolute seven-day expiry and nullable revoked_at. Refresh tokens
belong to a session and record a unique SHA-256 token hash, expiry and consumed_at.
Generate opaque tokens with 32 cryptographically random bytes; never store or log
raw refresh tokens. Preserve consumed hashes until the session expires so replay
can be detected. The seven-day limit does not slide on refresh.

Login creates a session and issues the existing 15-minute HS256 access token with
an additional sid claim. Validate sid against an active database session on
authenticated requests, so logout invalidates that session's access tokens too.
Tokens issued before this migration, without sid, require a fresh login. Separate
devices have independent sessions; signing out revokes only the current session.

Refresh locks the session row in a transaction, consumes the current token and
returns a replacement refresh cookie plus a new access token/profile. Reuse of a
consumed token revokes its session, including the replacement token. Commit that
revocation before returning 401; avoid rollback caused by throwing inside the
revocation transaction. Locking serializes concurrent refreshes. Strict replay
detection means simultaneous refresh in separate tabs can require signing in
again; document this limitation rather than weakening replay detection.

## HTTP and browser security

- POST /api/auth/login retains its JSON response and additionally sets the refresh
  cookie. Registration retains 201 profile response; frontend then shows login
  with success feedback.
- POST /api/auth/refresh reads only the HttpOnly refresh cookie and returns the
  existing token/profile response shape. Missing, expired, revoked or invalid
  tokens return generic 401 and clear the cookie.
- POST /api/auth/logout revokes the session identified by the refresh cookie and
  clears it. Return idempotent 204, including missing/already revoked sessions.
- GET /api/auth/csrf bootstraps Spring Security's CSRF token. Require its header
  for cookie-capable POST login/refresh/logout; use Spring's cookie CSRF token
  repository and SPA-compatible request handling. Registration remains a
  non-cookie endpoint. Bearer-only endpoints do not authenticate via cookies.
- Refresh cookie: HttpOnly, SameSite=Lax, Path=/api/auth, no Domain, seven-day
  lifetime. Secure by default; an explicit local dev setting permits plain HTTP.
  CSRF cookie is readable by the frontend and Secure in deployment.
- Retain exact allowed origins; permit credentialed CORS and X-XSRF-TOKEN header.
  Never combine credentials with wildcard origins. Default deny remains.
- Login, refresh, CSRF and identity responses use Cache-Control: no-store.
  Tokens, cookies and passwords must not appear in logs or validation errors.

Use a Vite /api proxy locally so browser requests are same-origin; production
serves frontend and API behind the same HTTPS origin. SameSite=Lax is deliberately
not a promise to support unrelated frontend/API sites.

## React integration

Add an auth API client, AuthProvider/useAuth and protected route boundary.
Keep access tokens only in memory; never localStorage/sessionStorage or URLs.
Provider bootstraps CSRF and attempts refresh on initial load. Distinguish
initializing, authenticated, anonymous and recoverable network-error states;
provide retry for network failures rather than falsely declaring logout.

Add responsive /login and /register pages using existing form, validation and
button patterns. Protect all portal routes. Successful login returns to a
validated internal requested path; reject external/protocol-relative redirects.
Show account name and accessible logout in desktop/mobile navigation.

API calls attach the in-memory Bearer token. On authentication 401, use one shared
refresh promise per tab and retry the original request once. Never intercept
login/refresh recursively and never refresh on 403. Ignore stale async results
after logout/account changes. Bootstrap performs one deduplicated refresh even
under React StrictMode. Logout blocks further requests, revokes on the server,
then clears local state; failed server logout shows retry feedback and does not
claim revocation succeeded.

Existing content and verification remain explicitly labeled browser demos.
Namespace their storage and session media by authenticated user ID, and reset
mounted views on account changes. Do not assign pre-existing anonymous demo data
to a newly signed-in account or erase it. Dashboard sample analytics stay labeled
as demo data. This storage scoping is UX isolation, not backend authorization.

## Verification and delivery

Backend: real PostgreSQL migration, refresh rotation, replay revocation, absolute
expiry, immediate access-token revocation, independent sessions, cookie flags,
CSRF failures/success, CORS, generic errors and default Swagger restrictions.
Update Swagger descriptions and testing steps for the new CSRF flow.

Frontend: registration/login validation and errors, protected redirects,
bootstrap retry, single-flight refresh, one retry, logout failure/success,
stale-response handling and account-scoped demo data. Run tests, lint and build.
Check mobile/tablet/desktop layouts and a full-stack HTTP flow. Record any browser
tool limitation accurately. Document local startup, session lifetime, migration
reauthentication and multi-tab refresh limitation.

Prepare a new branch without including the user's local README, application.yaml
or root docs edits. If PR #10 is not merged, stack on it and document the dependency;
retarget to main after it merges. Ask before pushing, per the user's standing rule.
