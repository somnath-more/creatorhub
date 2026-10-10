# Backend foundation design

Status: approved in conversation, updated to the user's requested layered packages.

## Outcome and scope

Extend the existing Spring Boot application into the foundation for CreatorHub's
monolithic backend. Keep Java 17, Maven Wrapper, Spring Boot 4.1.1, and the existing
`com.ampacash.creatorhub` base package, subject to dependency/build verification.
The existing project has no authentication implementation; this PR must not claim
to preserve or provide token authentication.

Deliver PostgreSQL configuration, Flyway migrations, feature package boundaries,
consistent HTTP errors, validation support, explicit CORS configuration, health
checks, tests, and local startup documentation. Leave business endpoints and
frontend persistence unchanged.

## Approach and trade-offs

Use a layered monolith with PostgreSQL and Flyway. This keeps one
deployment and transaction boundary while allowing content, verification, and
analytics to grow independently inside the application.

The user selected controller/service/model/DTO/repository layers. Group future
feature-specific classes by clear names inside these layers; introduce feature
subpackages if their size warrants it. Microservices introduce deployment,
network, and consistency overhead that this assessment does not need.

## Packages and dependencies

- `controller`: HTTP endpoints; calls service interfaces and uses DTOs.
- `service`: business service interfaces.
- `service.impl`: implementations; business rules and transaction boundaries.
- `model`: JPA entities, starting with the minimal creator profile.
- `dto`: API request/response types and validation error details.
- `config`: application security, CORS, and configuration properties.
- `exception`: exception translation and the ProblemDetail contract.
- `repository`: Spring Data persistence interfaces.

Dependency direction: Controller -> Service -> ServiceImpl -> Repository -> Model.
Controllers must not access repositories directly or expose JPA entities as API
responses. Validation annotations belong on future request DTOs; business rules
belong in service implementations. Register implementations through Spring
dependency injection and use constructor injection for required collaborators.

Document reserved packages using package documentation; do not create placeholder
controllers or empty service classes. Auth, creator, content, verification, and
analytics business endpoints remain later milestones. Use Spring MVC, Validation, Data JPA,
PostgreSQL JDBC, Flyway's PostgreSQL support, Actuator, and Spring Security.
Resolve versions through Spring Boot dependency management where available.

## Database and migrations

Use environment-based datasource configuration and PostgreSQL in local Docker
Compose. The database password is required with no application default; local Compose
and Spring read it from the environment. Deployed environments must supply credentials. Ignore local secret/environment files.

Flyway owns schema changes. Disable Hibernate schema creation and use validation.
The initial migration creates a minimal creator profile table with a UUID primary
key, unique stable principal reference, and creation/update timestamps. Do not
prebuild content, payment, verification-document, or analytics tables before their
business models are designed. Authentication will later establish the trusted
principal reference; this PR exposes no creator mutation endpoint.

## Security and browser access

Permit only public health checks and approved CORS preflight requests. Deny other
application requests until authenticated business APIs are introduced. Do not
provide generated-password login, a fake JWT mechanism, or an unrestricted
development security configuration.

Configure exact frontend origins through environment variables, defaulting to
`http://localhost:5173` and `http://127.0.0.1:5173` locally. Avoid wildcard origins
and credentialed CORS in this milestone. Future token integration must revisit
the security chain, authorization rules, and CSRF based on the chosen token or
cookie transport.

## HTTP contracts and health

Use RFC 9457 ProblemDetail responses with stable status/title/detail/instance
fields. Validation errors add field-level errors. Unexpected exceptions log
server-side details and return a generic message; do not expose stack traces,
SQL, or secrets. Security failures must use the same problem JSON contract.

Expose Actuator health without public dependency details. Liveness indicates
application process health; readiness includes database availability. Keep other
Actuator endpoints private/unexposed. No public validation demonstration endpoint
is needed: exercise invalid requests through a test-only controller.

## Verification and developer workflow

Use Maven Wrapper verification for compilation and tests. Test validation and
error responses, allowed/disallowed CORS, default-deny security, and health.
Verify migration application and JPA startup against real PostgreSQL, preferably
through Testcontainers. Do not use H2 as evidence of PostgreSQL compatibility.

Docker CLI is installed on this machine, but its daemon is currently unavailable.
Unit/web tests can proceed independently; database integration verification needs
a running Docker engine or an accessible PostgreSQL instance. Report any remaining
verification gap explicitly rather than silently skipping it.

Document PowerShell commands for starting PostgreSQL, running the application,
executing tests, checking health, and configuring environment variables. Commit
only the backend foundation and its documentation; keep the existing root README,
root requirements document, and frontend untouched. Ask before pushing the PR.
