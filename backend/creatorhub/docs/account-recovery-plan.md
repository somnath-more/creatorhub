# Account recovery and email verification

User approved PR #12 scope and explicitly requested immediate inline implementation.
Use writing-plans/executing-plans and TDD; perform one final independent review.

## Design and boundaries

Preserve the layered Spring monolith and current content/identity demos. Add V4
with users.email_verified_at and hashed single-use account_action_tokens. Opaque
32-byte random reset links expire in 30 minutes; verification links in 24 hours.
Links use URL fragments, a configured frontend origin, and explicit POST actions
so GET/email scanners do not consume tokens. Do not log raw tokens/passwords.

User-row locks serialize issue/consume/reset/login; older links for the same
purpose are invalidated and issuing has a 60-second per-account cooldown.
Password reset uses existing validation and BCrypt and revokes every session.
Forgot-password responses are always generic 202, including unknown accounts and
SMTP failures; failures log a generic delivery warning. Delivery is synchronous
with bounded timeouts, no outbox or guarantee of delivery. Resend remains possible.

New registration sends a verification email without undoing account creation on
delivery failure. Authenticated resend needs creator scope. Verification requires
the email link, not a client-supplied status. Profile gains emailVerified; login
and drafts remain available without verification. Identity verification is separate.

SMTP uses Spring Mail, local Mailpit (SMTP 1025, inbox 8025, localhost bindings),
configurable sender/origin and deployment SMTP settings. No paid email provider
or external deployment is created. Public reset/verification APIs authenticate by
token, not cookies; existing cookie CSRF rules remain. Abuse/IP limits and a durable
mail outbox are deployment follow-ups, not promised by this demo PR.

## Execution record
- Backend test compilation failed before the recovery service existed (red).
- Implemented V4, DTOs, repositories, service/interface/impl, SMTP delivery,
  recovery endpoints, registration mail and persisted profile verification.
- Added frontend recovery forms, validation, login link, verification banner,
  resend and profile refresh with five new UI regression tests.
- PostgreSQL tests cover single use, purpose, expiry, cooldown, reissue, mail
  failure rollback, password/session revocation, concurrent token consumption
  and reset racing login/refresh. All 42 backend tests pass (18 unit, 24 integration).
- All 97 frontend tests pass; ESLint and production build pass.
- Maven package and failsafe verification finish with exit code 0.
- Live Mailpit SMTP smoke test passed registration email, email confirmation,
  password reset email, session revocation and login with the new password.
- Independent read-only review found no blocking defect. Its concurrency test
  gap was addressed. Scrubbing links means a reload requires reopening the email.
- Push remains subject to user approval.

Endpoints: POST /api/auth/forgot-password (email ->202), /reset-password
(token,password ->204), /verify-email (token ->204);
POST /api/account/email-verification/resend (Bearer ->202).
All responses no-store; invalid/expired/reused tokens share a safe 400.
