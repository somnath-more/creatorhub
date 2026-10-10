# Authentication implementation record

Plan: authentication-plan.md. Specification: authentication-design.md.

All three implementation tasks complete: accounts/validation, JWT HTTP security,
and development Swagger/documentation. Controller, service/interface and impl,
model, DTO, config, exception and repository layers follow the existing monolith.

## Verification on 2026-10-10

- `./mvnw.cmd -q verify -Pintegration` passed: 18 unit/MVC tests and 12
  PostgreSQL integration tests, no failures, errors or skips. Packaging succeeded.
- Integration tests used an isolated PostgreSQL 17 Testcontainer, applying V1/V2.
  Existing user PostgreSQL/pgAdmin containers were not modified.
- Coverage includes password validation/hash storage, normalized duplicate email,
  direct database uniqueness, registration rollback, generic login failures,
  two-account identity isolation, missing/tampered tokens, issuer/audience/expiry,
  unsupported algorithm headers, missing/future issued-at, invalid signing keys,
  CORS regressions, dev Swagger and documentation disabled by default.
- Packaged-server smoke test against a dedicated local test database on port
  55432: Swagger UI 200, OpenAPI Bearer scheme, register/login/me succeeded,
  token lifetime 900 seconds and authenticated creator identity matched.
- `git diff --check` passed.
- Independent read-only review found no blocking implementation issue. Its two
  test gaps (database uniqueness and second-account isolation) were addressed
  before the final green suite.

## Decisions and limitations

Ruling: keep the user's uncommitted application.yaml and root documentation edits
outside this commit. OpenAPI defaults are in a separate properties resource so
those datasource changes remain untouched.

Ruling: browser interaction could not be verified because Browser discovery
returned no connected browser. HTTP integration and live packaged-server checks
verified the UI asset and OpenAPI schema; interactive Try it out/Authorize remains
a manual check using authentication.md. No browser-success claim is made.

This milestone has no frontend wiring, refresh/revocation, email verification,
password reset or abuse throttling. Production launch needs those decisions and
HTTPS/secret management. Content publishing identity verification remains separate.
The branch is prepared locally; pushing/opening GitHub PR awaits user confirmation.
