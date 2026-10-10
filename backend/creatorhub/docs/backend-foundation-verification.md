# Backend foundation execution and verification

## Decisions

- Used the user's layered packages instead of the initially proposed feature
  packages. Controller/service/implementation layers are documented boundaries;
  business classes arrive with real APIs.
- Required DATABASE_PASSWORD rather than providing a password default. Compose
  and Spring must receive the same explicit local development value.
- Removed unused Lombok processing from the starter; the small entity uses
  explicit constructors/accessors and JPA lifecycle callbacks.
- Used an explicitly qualified CORS source: Spring MVC also supplies a
  CorsConfigurationSource, and an unqualified injection was ambiguous.
- Docker's daemon was unavailable. PostgreSQL 17.6 was installed, so integration
  verification used a new isolated cluster in ignored target output on localhost
  port 55432. Existing PostgreSQL databases were not used or modified.
- Integration tests support either default Testcontainers or an explicitly
  configured dedicated test database. Missing infrastructure fails the run rather
  than silently skipping tests. The Docker launch path was not exercised locally.
- Combined implementation into one cohesive foundation commit after the design
  commits, rather than committing incomplete intermediate infrastructure.

## Verification results

Baseline starter context test passed. New error/schema tests initially failed
compilation because their implementation classes were absent. During development,
security tests exposed the CORS-source ambiguity and test-only controller
registration; both were corrected and the complete suite rerun.

Final command: `mvnw.cmd -q verify -Pintegration`, with TEST_DATABASE_URL,
TEST_DATABASE_USERNAME, and TEST_DATABASE_PASSWORD pointing to the isolated cluster.

- 4 MVC error tests passed: field validation, malformed JSON, safe unexpected
  errors, and unsupported methods.
- 5 security/CORS tests passed: public health, denied unfinished routes, denied
  authenticated requests, exact-origin preflight, rejected origins, and denied POST.
- 2 CORS configuration tests passed: exact origins and invalid wildcard/path/
  credential/empty configurations.
- 4 PostgreSQL integration tests passed: migration/JPA mapping, unique principals,
  blank-principal constraint, and health/liveness/readiness with hidden details.
- Total: 15 tests, zero failures/errors/skips. Executable JAR packaging passed.

The packaged JAR was also started on localhost port 8087. With the isolated
database running, readiness returned 200/UP. Stopping only that cluster caused
readiness to return 503/DOWN while liveness remained 200/UP. Public responses
contained no dependency components. The database was restored after the check.

A fresh read-only whole-branch review found no blocking implementation defects
and requested the outage check plus documentation corrections; these are complete.

## Remaining work

No registration/token authentication, creator-owned CRUD endpoints, frontend API
integration, or additional business tables are implemented in this PR. Production
needs an explicit authentication design and corresponding CSRF/authorization rules.
Frontend/root README/root requirements were not changed by this backend work.
