# Authentication API Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation and a final independent review.

**Goal:** Add registration, login, current identity, and development Swagger testing.
**Architecture:** Controller -> service interface -> service.impl -> repository -> model; DTOs at the boundary, JWT configuration and ProblemDetail errors shared.
**Tech stack:** Existing Java 17/Spring Boot 4.1.1, PostgreSQL/Flyway, BCrypt, Spring Security JWT resource server, springdoc 3.1.1.
**Spec:** [authentication-design.md](authentication-design.md).

## Constraints and review focus

Preserve V1, existing creator data, and uncommitted root/YAML edits. Do not expose
passwords, hashes, or signing keys. Default docs off; enable through dev profile.
Enforce transaction-safe registration, generic login failures, exact token claims,
UTF-8 BCrypt limits, per-user identity, and public-route restrictions. User approved
the design and explicitly requested implementation in this session; implement inline
and ask before pushing the finished PR.

## Task 1: Accounts and DTO validation

- [x] Add V2 users migration, User entity, UserRepository, and creator reference lookup.
- [x] Add RegistrationRequest/LoginRequest with write-only passwords and bounded validation, CreatorProfile, and TokenResponse DTOs.
- [x] Add AuthService/CreatorService interfaces and implementations using BCrypt, normalized emails, atomic user/profile creation, and database-backed uniqueness.
- [x] Add specific API exceptions and safe ProblemDetail translation.
- [x] Test normalization, password boundaries/hashing, duplicate registration, invalid credentials, and transaction rollback with PostgreSQL.

Files: model/User.java, repository/UserRepository.java, repository/CreatorRepository.java,
dto/{RegistrationRequest,LoginRequest,CreatorProfile,TokenResponse}.java,
service/{AuthService,CreatorService}.java, service/impl counterparts,
exception/ApiException.java, V2__create_users.sql, PasswordValidationTests.java, AuthenticationIT.java.

Interfaces: register(RegistrationRequest) -> CreatorProfile; login(LoginRequest) -> TokenResponse;
current(UUID userId) -> CreatorProfile. Creator IDs come only from trusted user identity.

## Task 2: Token and HTTP security

- [x] Write token tests for correct claims and rejected signature, algorithm, issuer, audience, expiry, and missing required claims.
- [x] Implement TokenService.issue(UUID) -> String, JwtProperties, JwtConfig, and PasswordConfig; require a Base64 secret of at least 32 bytes, HS256, issuer creatorhub, audience creatorhub-api, 900-second expiry, and 30-second skew.
- [x] Implement AuthController register/login and CreatorController GET /api/me.
- [x] Update SecurityConfig for public POST auth endpoints, scoped /api/me, default deny, and standard Bearer challenges with safe problem JSON.
- [x] Run complete unit/web tests and real token HTTP integration checks; keep CORS regression tests.

## Task 3: Swagger and release verification

- [x] Add springdoc 3.1.1 and OpenApiConfig with HTTP Bearer security; public auth operations, protected me operation, no persisted Swagger authorization.
- [x] Default documentation off using OpenAPI configuration; enable through application-dev.yaml. Test default-off and dev-on routes/schema.
- [x] Document startup, signing-key generation, Swagger register/login/Authorize/me workflow, and production limitations.
- [x] Run Maven verify and integration profile against a dedicated PostgreSQL instance. Verify Swagger in a browser when a connected browser is available; otherwise record that limitation and verify packaged-server HTTP responses.
- [x] Conduct one independent read-only review; fix issues, verify, and commit backend-only changes. Ask before pushing.

Keep implementation decisions and exact verification results in authentication-verification.md.

