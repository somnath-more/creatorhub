# CreatorHub backend

Java 17 / Spring Boot 4.1.1 monolith with Maven Wrapper, PostgreSQL 17, Flyway,
JPA, Validation, Security, and Actuator. Includes registration, JWT login,
current-creator identity, and development Swagger testing. Frontend integration
now includes refresh sessions, logout and protected React routes. Content APIs
remain separate. See [session setup](docs/sessions.md).

## Layers

Under `com.ampacash.creatorhub`:

```text
controller -> service (interface) -> service.impl -> repository -> model
                 dto             config             exception
```

Controllers use DTOs and service interfaces, never repositories directly.
Service implementations own transactions and business rules. JPA entities stay
inside the persistence/business layers. Required dependencies use constructor
injection. Authentication follows these layers with database-backed accounts.

The first Flyway migration creates `creators` with a UUID ID, a unique nonblank
principal reference, and timestamps. V2 adds users; creator references are
derived from the authenticated user UUID as `local:<userId>`.

## Local startup (PowerShell)

Install JDK 17 and Docker Desktop. From `backend/creatorhub`:

```powershell
$env:DATABASE_PASSWORD = 'choose-a-local-development-password'
docker compose up -d
$authKeyBytes = New-Object byte[] 32
$authRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$authRng.GetBytes($authKeyBytes)
$authRng.Dispose()
$env:APP_JWT_SECRET = [Convert]::ToBase64String($authKeyBytes)
$env:APP_AUTH_COOKIE_SECURE = 'false' # Local HTTP only; deployment default is true.
.\mvnw.cmd spring-boot:run
```

The password above is a local example; use your own value. Compose and Spring both
read the shell variable. Compose can also read `.env`, but Spring Boot does not
automatically import that file: set the application environment explicitly.
`.env.example` documents the keys; actual `.env` files are ignored.

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
Invoke-RestMethod http://localhost:8080/actuator/health/liveness
Invoke-RestMethod http://localhost:8080/actuator/health/readiness
```

Each healthy response is `{"status":"UP"}`. Public responses hide dependency
details. Database outages make readiness unhealthy while liveness remains tied
to application process availability. Startup requires the database: Flyway runs
before Hibernate validates the schema. Existing databases are never auto-baselined.

| Variable | Default / requirement |
| --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/creatorhub` |
| `DATABASE_USERNAME` | `creatorhub` |
| `DATABASE_PASSWORD` | Required; no application default |
| `DATABASE_POOL_SIZE` | `10` |
| `APP_JWT_SECRET` | Required Base64 encoding of at least 32 random bytes |
| `SPRING_PROFILES_ACTIVE` | Set `dev` to enable Swagger; disabled by default |
| `APP_AUTH_COOKIE_SECURE` | `true`; explicitly use `false` for local HTTP only |
| `SERVER_PORT` | `8080` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |
| `DATABASE_PORT` | Compose host port, `5432`; update `DATABASE_URL` if changed |

To use an existing PostgreSQL instance, set the datasource variables and omit
Compose. Use a dedicated database. Deployed environments need managed secrets,
appropriate database privileges/TLS, and explicitly configured frontend origins.

## Security and API errors

GET requests to the three health endpoints and POST registration/login are public.
GET `/api/auth/csrf` and POST refresh/logout are public with CSRF on cookie writes.
GET `/api/me` requires a valid JWT with creator scope and an active server session. Swagger routes are public
only when documentation is enabled. Other routes are denied. CORS allows exact HTTP(S)
origins and explicit methods/headers, with credentials allowed and no wildcard origins.
Invalid origin configuration fails validation at startup.

Accounts use BCrypt password hashes in PostgreSQL. An empty framework user store
suppresses generated development accounts; application login uses AuthService.
Business authentication uses explicit Bearer headers and no HTTP session or
form/basic login. Login, refresh and logout additionally use an HttpOnly refresh
cookie with CSRF protection. Exact-origin credentialed CORS is enabled. Access
tokens last 15 minutes; sessions last at most seven days and logout revokes them.

MVC validation errors, malformed JSON, unexpected failures, and security
authentication/access-denied errors use RFC 9457 `application/problem+json`.
Validation adds `errors: [{field, message}]`; responses never contain stack traces
or rejected values. Unexpected exceptions are logged server-side with generic
client messages. Rejected CORS requests use Spring's standard 403 response.

## Verification

```powershell
# Unit and MVC/security tests; no database or Docker required.
.\mvnw.cmd verify

# Full suite with a fresh PostgreSQL Testcontainer; Docker must be running.
.\mvnw.cmd verify -Pintegration
```

Alternatively, use a dedicated PostgreSQL test database:

```powershell
$env:TEST_DATABASE_URL = 'jdbc:postgresql://localhost:5432/creatorhub_test'
$env:TEST_DATABASE_USERNAME = 'creatorhub_test'
$env:TEST_DATABASE_PASSWORD = 'your-test-database-password'
.\mvnw.cmd verify -Pintegration
```

Integration tests apply migrations and write test creator records. Never point
them at production or a database containing valuable data. Tests do not silently
skip when PostgreSQL or Docker is unavailable. The default suite excludes `*IT`;
the integration profile runs them through Maven Failsafe. No H2 substitution.

Keep subsequent schema changes in new versioned migrations; do not edit V1 after
it has been applied to shared environments. `docker compose down` stops local
services and preserves the named database volume.

References: [Spring Boot testing](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html),
[Flyway initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html),
[Testcontainers PostgreSQL](https://java.testcontainers.org/modules/databases/postgres/).
