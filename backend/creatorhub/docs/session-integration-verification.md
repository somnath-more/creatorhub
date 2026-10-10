# Session integration execution record

Spec: session-integration-design.md. Plan: session-integration-plan.md.

Pre-flight: backend TokenResponse shape is reused by the frontend client. Access
tokens acquire sid; old tokens require login. Session grants remain internal.
Demo account scope is set by auth transitions and views remount by user identity.
Ruling: execute inline as explicitly requested after written-spec approval.
No additional implementation-approval prompt; pushing still requires approval.

Task 1: complete. Added V3 session/token tables, hashed opaque refresh tokens,
absolute expiry, serialized rotation, replay revocation and sid-aware access
validation. SessionAuthenticationIT was first observed failing: missing CSRF
endpoint (401) and cookie writes not requiring CSRF. Existing login tests now
obtain real CSRF cookies instead of relying on a mock header incompatible with
the SPA request handler.

Task 2: complete. Added auth client/provider, responsive login/register,
protected routes, restoration and logout, account-scoped demo repositories/media.
Client/storage tests first failed for absent modules; route tests failed before
the routes existed. The full suite subsequently exposed and fixed a Zod pipeline
ordering error. Bound test workers to four after CPU starvation caused unrelated
DOM workflow timeouts on this Windows machine.

Task 3: complete. Documentation and Swagger CSRF support updated; independent
review performed. Both review findings were reproduced with failing deferred
response tests, then fixed: pending login is serialized and awaited by logout,
and retried API responses check the account generation before returning.

## Final verification (2026-10-10)

- `mvnw.cmd -q verify -Pintegration`: PASS, 18 unit/MVC tests plus 17 real
  PostgreSQL integration tests, no failures/errors/skips. Maven packaging passed.
- Backend checks include rotation, replay revocation committed on 401, immediate
  logout revocation, independent sessions, absolute expiry, concurrent refresh,
  HttpOnly/Secure/SameSite cookie flags, CSRF, CORS and previous API regressions.
- `npm test`: PASS, 92 tests across 19 files, including StrictMode initialization,
  auth forms/routes, offline recovery, request retry, failed logout, login/logout
  races, stale retry responses and account-scoped demo storage/media.
- `npm run lint` and `npm run build`: PASS.
- Live packaged backend plus Vite proxy on temporary port 5187: register, login,
  refresh rotation, me and logout passed. Local HTTP cookie override applied;
  the revoked access token received 401. Swagger initializer contained its CSRF
  cookie/header interceptor.
- `git diff --check`: PASS.

Ruling: Windows locks a running JAR, so an initial final-package attempt failed
while the smoke server was running. Stop that temporary process, rerun verify,
then start the verified JAR for smoke testing. No product change was needed.

Browser discovery returned no connected browser. Interactive Swagger and visual
layout checks at mobile/tablet/desktop widths remain manual; no browser or
screenshot success is claimed. The existing unrelated Vite servers and user's
PostgreSQL/pgAdmin containers were left alone. Temporary processes/database
started for this task are stopped after verification.

Known limits: strict replay protection can require login after simultaneous
cross-tab refresh or a lost response; expired-session pruning is documented but
not scheduled. Demo storage scoping is not server authorization. Remaining two
PRs cover recovery/email verification and backend content/publishing.
## Local startup follow-up

After implementation, local startup exposed a conflicting PostgreSQL instance on
5432 and a missing signing key. Default the dedicated Compose database and Spring
datasource to 127.0.0.1:5433, retaining environment overrides. Import an optional
git-ignored .env.local.properties outside packaged resources for persistent local
signing-key and HTTP-cookie settings. Local database password defaults are for
development; shared environments must override them.

Compose configuration validation passed. The dedicated database is healthy and
accepts the configured credentials. A fresh Spring startup using the ignored
local key returned health UP and readiness UP. The user confirmed the application
works and authorized pushing/opening the PR. The generated signing key remains
untracked; unrelated root README/docs changes remain outside the PR.
