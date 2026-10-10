# Registration, JWT authentication, and Swagger design

Status: proposed for review before implementation.

## Outcome and boundaries

Implement backend registration, login, and current-creator APIs following the
approved controller -> service interface -> service.impl -> repository -> model
architecture, with dto, config, and exception packages. Add Swagger UI so the APIs
can be exercised without frontend login pages. Preserve existing PostgreSQL data,
V1 migration, health/error contracts, and local uncommitted configuration edits.

This PR does not add refresh tokens, logout/revocation, password reset, email
verification, publishing, creator-owned content CRUD, or frontend integration.

## Approach

Use local accounts with BCrypt password hashes and Spring Security's standard
JWT resource-server support. This keeps authentication inside the existing
monolith and avoids a custom JWT parsing filter. An external identity provider is
a reasonable production alternative but adds account/provider setup outside this
assessment. Session cookies would require a different browser/CSRF contract;
Bearer headers suit the requested API and Swagger testing workflow.

## API contracts

| Endpoint | Request | Success |
| --- | --- | --- |
| `POST /api/auth/register` | `fullName`, `email`, `password` | 201 creator profile |
| `POST /api/auth/login` | `email`, `password` | 200 access token and creator profile |
| `GET /api/me` | `Authorization: Bearer <token>` | 200 creator profile |

Creator profile: `userId`, `creatorId`, `fullName`, `email`.
Login response: `accessToken`, `tokenType: Bearer`, `expiresIn: 900`, `creator`.
Registration does not automatically log in; Swagger testing explicitly uses login.

Canonicalize email with trim and Locale.ROOT lowercase on both register/login.
Validate nonblank full name up to 100 characters and email up to 254 characters.
Registration passwords must contain at least 12 characters and at most 72 UTF-8
bytes; do not trim passwords or silently truncate BCrypt input. Apply a bounded
input policy on login as well. Request DTO password fields are write-only in
OpenAPI and omitted from generated string representations/logging.

Return existing ProblemDetail JSON for errors: invalid requests 400, duplicate
email 409, invalid credentials 401, missing/invalid/expired Bearer tokens 401,
and insufficient authorization 403. Login uses the same generic error for unknown
email and incorrect password and performs a dummy BCrypt comparison for unknown
accounts. Do not return hashes, raw passwords, parser details, or signing keys.

## Persistence and transactions

Add `V2__create_users.sql` with a `users` table: UUID primary key, canonical unique
email, full name, password hash, and created timestamp. Database constraints enforce
required fields and canonical/unique email; service checks improve normal feedback
but the unique constraint also handles concurrent registrations.

Registration creates the user and a creator profile in one transaction. The
existing creator `principal_reference` becomes `local:<user UUID>` for new local
accounts. Keep preexisting creator profiles intact. Resolve `/api/me` from the
validated token subject and that server-derived reference; never accept a creator
ID or owner reference from the client.

Use the existing principal-reference uniqueness as the profile linkage in this
milestone, allowing future external identities without changing V1. A future
identity-linking feature can introduce explicit provider/subject relationships.

## JWT and security

Issue HS256 tokens signed by a required Base64-encoded secret with at least 32
random bytes. Read it through `APP_JWT_SECRET`, without a committed/default key.
Use issuer `creatorhub`, audience `creatorhub-api`, user UUID subject, issued-at,
expiration, unique token ID, and `scope: creator`. Access tokens last 15 minutes.
Validate signature, fixed algorithm, issuer, audience, required expiration/subject,
and time validity. Allow only the configured short clock skew and test expiration
beyond it. Do not accept arbitrary scopes from registration/login input.

Permit only POST register/login, GET health endpoints, and development-enabled
documentation routes. Require `SCOPE_creator` for GET `/api/me`; deny unfinished
routes. Keep stateless Bearer authentication, disabled form/basic login, disabled
session/request caching, and exact-origin credential-free CORS. CSRF remains
disabled because authentication uses explicit Authorization headers, not cookies.
Use the standard Bearer authentication/denial handlers with the existing problem
JSON writer and appropriate WWW-Authenticate response headers.

There is no logout/revocation in this milestone; an issued token stays usable until
expiration unless its signing key changes. Production needs HTTPS, rate limiting
for login/registration, key management/rotation, email verification, and recovery
flows before broader release. These are documented limitations, not implied features.

## Swagger testing

Use springdoc-openapi 3.1.1, which supports Spring Boot 4, with an OpenAPI HTTP
Bearer security scheme. Keep documentation disabled by default. A `dev` profile
enables `/swagger-ui/index.html` and `/v3/api-docs`; only enabled documentation GET
routes are public. Auth endpoints have no security requirement; `/api/me` displays
the Bearer requirement. Do not persist authorization tokens in Swagger browser
storage or provide real credentials as examples.

Document: start the database, generate a local signing key, run with the dev
profile, register, log in, paste the access token into Swagger's Authorize dialog,
and call `/api/me`. Clear Authorize before retrying login with an expired token.

## Files and verification

Add AuthController/CreatorController; AuthService, CreatorService, TokenService
interfaces and their implementations; User model/repository; registration/login/
token/profile DTOs; JWT/password/OpenAPI configuration; and specific API exceptions.
Use a separate dev YAML file and configuration-property defaults where possible so
the user's uncommitted datasource YAML edit remains outside the PR.

Tests must cover password hashing, normalization, validation and Unicode password
limits, invalid credentials, duplicate registration including database constraints,
atomic creator creation, current identity isolation, valid/tampered/wrong-issuer/
wrong-audience/expired/missing-expiration tokens, restricted routes, CORS, and
Swagger's enabled/disabled configuration and Bearer schema. Run the complete Maven
suite and PostgreSQL integration profile; test Swagger UI manually in a browser.
Use a dedicated test database/container, never the user's existing application
database. Ask before pushing/opening the PR after implementation and verification.

References: [springdoc](https://springdoc.org/),
[Spring Security JWT resource server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).
