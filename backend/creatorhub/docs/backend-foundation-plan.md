# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make the existing backend a testable PostgreSQL-backed layered monolith without adding business APIs.

**Architecture:** Use the user's controller, service, service.impl, model, dto, config, exception, and repository packages. Controllers will call service interfaces; implementations will own business rules and transactions. The foundation exposes health and denies unfinished application APIs.

**Tech Stack:** Java 17, Maven Wrapper, Spring Boot 4.1.1, Spring MVC, Validation, Security, Actuator, Data JPA, PostgreSQL, Flyway, JUnit, Testcontainers.

**Spec:** [backend-foundation-design.md](backend-foundation-design.md)

## Global constraints

- Keep the existing `com.ampacash.creatorhub` base package and Java 17.
- Resolve managed dependency versions through Spring Boot; verify existing versions before changing them.
- No authentication implementation currently exists. Do not invent token login in this PR.
- No business endpoints, frontend changes, H2 compatibility claims, or Hibernate schema creation.
- Keep root README and root docs untouched; only backend work belongs in this PR.
- Ask before pushing; a running PostgreSQL/Docker environment is required for database verification.

## Review focus

- Disallowed origins must receive no permissive CORS headers; test exact origin matching.
- Security errors must be JSON problems rather than HTML/generated-login responses.
- Malformed JSON and invalid DTO fields must not expose exception internals.
- Database unavailability must affect readiness without exposing connection details publicly.
- Schema constraints and migrations must be checked against PostgreSQL, not an in-memory substitute.

## File map

Paths below are relative to `backend/creatorhub`.

- `pom.xml`: managed dependencies and explicit PostgreSQL integration-test execution.
- `compose.yaml`, `.env.example`, `.gitignore`: local database setup and secret exclusions.
- `src/main/resources/application.yaml`: environment configuration and health exposure.
- `src/main/resources/db/migration/V1__create_creators.sql`: creator profile schema.
- `src/main/java/com/ampacash/creatorhub/model/Creator.java`: persistence mapping.
- `src/main/java/com/ampacash/creatorhub/repository/CreatorRepository.java`: persistence access.
- `src/main/java/com/ampacash/creatorhub/config/SecurityConfig.java`: default-deny filter chain.
- `src/main/java/com/ampacash/creatorhub/config/CorsProperties.java`: explicit allowed origins.
- `src/main/java/com/ampacash/creatorhub/exception/ApiExceptionHandler.java`: MVC problem responses.
- `src/main/java/com/ampacash/creatorhub/exception/ApiProblemWriter.java`: security problem responses.
- `src/main/java/com/ampacash/creatorhub/dto/FieldViolation.java`: validation field/message DTO.
- `controller/package-info.java`, `service/package-info.java`, `service/impl/package-info.java`: reserved layer contracts, without fake endpoints or empty implementations.
- `src/test/java/com/ampacash/creatorhub/ApiFoundationTests.java`: web/security/error contracts.
- `src/test/java/com/ampacash/creatorhub/CreatorRepositoryIT.java`: real PostgreSQL migrations and mapping.
- `README.md`: commands, configuration, package rules, limitations, and verification results.

## Task 1: Database foundation

**Interfaces:** `Creator` maps the `creators` table; `CreatorRepository extends JpaRepository<Creator, UUID>` exposes persistence. No public service API is introduced yet.

- [x] Add a PostgreSQL integration test asserting Flyway applies V1, a creator profile persists and reloads, and duplicate principal references fail.
- [x] Run the test and confirm missing schema/dependencies cause the expected failure. If Docker remains unavailable, record that prerequisite and continue independent web work.
- [x] Add Data JPA, PostgreSQL, Flyway PostgreSQL support, and test dependencies through Boot management. Configure an explicit integration-test Maven profile.
- [x] Implement UUID identity, unique non-null principal reference, and creation/update timestamps in V1 and the entity mapping. Let PostgreSQL enforce constraints; Hibernate validates the schema.
- [x] Add Compose with a pinned PostgreSQL major version and localhost-bound port, environment-driven datasource settings, and ignored local credentials.
- [x] Run integration verification against PostgreSQL; confirm Flyway and repository assertions pass before claiming database validation.
- [x] Commit the database foundation, excluding generated artifacts and secrets.

## Task 2: HTTP errors, security, CORS, and health

**Interfaces:** `FieldViolation(String field, String message)` represents validation details. `ApiExceptionHandler` returns `ProblemDetail`; `ApiProblemWriter` writes the same shape for security failures. `SecurityConfig` provides `SecurityFilterChain` and `CorsConfigurationSource` beans using `CorsProperties`.

- [x] Write web tests for invalid DTO fields, malformed JSON, and unexpected errors through a test-only controller. Assert status, `application/problem+json`, standard problem fields, and safe messages.
- [x] Write tests allowing exact configured localhost origins and rejecting another origin, with no wildcard or credentialed CORS.
- [x] Write tests for public health, denied application routes, JSON security errors, and no generated-login redirect. Separate MVC handler tests from security tests so test routes need not become public production APIs.
- [x] Run these tests and confirm their expected failures before implementing the relevant behavior.
- [x] Implement error translation in `exception`, DTO details in `dto`, and configuration in `config`; use constructor injection.
- [x] Add Actuator health with public details disabled and liveness/readiness groups. Include database health in readiness; keep other endpoints unexposed.
- [x] Run web tests independently of database infrastructure, then verify actual database-backed readiness when PostgreSQL is available.
- [x] Commit HTTP infrastructure and its tests.

## Task 3: Layer contracts, startup guide, and final verification

**Interfaces:** No additional runtime APIs. Documentation defines Controller -> Service interface -> ServiceImpl -> Repository -> Model, DTO boundaries, and future authentication responsibilities.

- [x] Document reserved controller/service/implementation layers using package documentation. Do not add placeholder business classes.
- [x] Replace the generated context-only test with meaningful coverage from the previous tasks; keep full application startup verification in the PostgreSQL integration suite.
- [x] Document PowerShell startup: `docker compose up -d`, `.\mvnw.cmd spring-boot:run`, health requests, environment settings, unit/web verification, and PostgreSQL integration verification.
- [x] Run `.\mvnw.cmd verify` for the default suite and `.\mvnw.cmd verify -Pintegration` for real database tests. Record exact results and any infrastructure blocker.
- [x] Confirm production packaging succeeds, no secrets/build outputs are tracked, and the frontend/root files are unchanged by this PR.
- [x] Review the branch diff and commit only backend work. Summarize remaining authentication and CRUD work, then ask before pushing.

## Execution

Recommended: implement directly in this session. The tasks share configuration and need sequential verification; this scope does not need parallel agents. The user approved implementation and opening the PR. Completed inline; review and verification recorded in backend-foundation-verification.md.
