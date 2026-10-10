# Session integration implementation plan

> Use superpowers:executing-plans inline with a final independent review.

Goal: complete the approved session-integration-design.md.
Architecture: layered Spring monolith with PostgreSQL sessions and a React auth
provider/client; browser cookie refresh, in-memory Bearer access tokens.
Tech stack: existing Java 17, Spring Security, PostgreSQL/Flyway, React/TypeScript.

User approved the written design and explicitly directed implementation inline.
Preserve unrelated edits; do not push until asked. PR #10 is merged into main.

## Task 1: Backend sessions and HTTP security
- [x] Write failing SessionAuthenticationIT for rotation, replay, logout, session
  independence, CSRF and cookie flags; run and confirm failures.
- [x] Add V3, AuthSession/RefreshToken models and repositories, SessionService and
  implementation, session-aware JWT validation and issuance.
- [x] Add SessionController, refresh-cookie configuration and SPA CSRF bootstrap;
  update login and exact credentialed CORS. Update existing tests for CSRF.
- [x] Verify unit and PostgreSQL integration suites.

Interfaces: SessionService.start(UUID), rotate(String) -> SessionGrant;
logout(String); isActive(UUID sessionId, UUID userId) -> boolean.
SessionGrant carries TokenResponse plus refresh token/absolute expiry internally.
POST login/refresh returns TokenResponse; refresh token only in HttpOnly cookie.

## Task 2: React authentication and account isolation
- [x] Write failing auth client/provider/route tests and storage isolation tests.
- [x] Add single-flight client, provider/useAuth, auth pages and protected routes;
  Vite API proxy and account menu/logout. Keep access tokens only in memory.
- [x] Scope draft/verification/media demo data by user ID; never migrate anonymous
  demo data implicitly. Guard stale operations when the account changes.
- [x] Run frontend tests, ESLint and production build.

Files: frontend/src/features/auth/*, pages/{LoginPage,RegisterPage}, App/main,
PortalLayout, Vite config, shared accountScope and demo repositories.

## Task 3: Verification and delivery
- [x] Update Swagger, startup/session documentation and verification ledger.
- [x] Full-stack HTTP checks; responsive/browser check if available, otherwise
  document limitation. Run final suites and independent review, fix findings.
- [x] Commit only intended files; ask before pushing.

Review focus: replay revocation commits on failure, refresh races, expired sessions,
CSRF/CORS boundaries, stale async results after logout, StrictMode bootstrap,
failed logout retry, account isolation and no raw tokens in logs/storage.
