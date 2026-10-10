# Password reset and email verification

Run `docker compose up -d postgres mailpit` from `backend/creatorhub`.
Start Spring Boot and Vite as described in the authentication guide. Mailpit captures local mail at http://localhost:8025; no external email is sent.

Registration sends a verification link. Sign in to resend it from the workspace banner. Email verification is separate from identity verification and does not block access or draft creation. The login page links to password recovery.

Reset links expire after 30 minutes; verification links after 24 hours. Each link is single use, contains 256 random bits, and only its SHA-256 hash is stored. New requests invalidate older links of the same purpose, with a 60-second per-account cooldown. Links carry the token in a URL fragment; the frontend removes it from the address bar and requires an explicit submit. Reloading a scrubbed page requires reopening the email link. Tokens are never saved in browser storage.

A password reset revokes every existing session, including access tokens through the existing session validator. Unknown email addresses and mail delivery failures return the same generic response. SMTP failures roll back token issuance, allowing retry without invalidating a previously delivered link. SMTP delivery is synchronous with three-second I/O timeouts: response timing is not an account-enumeration defense. A production deployment should add edge IP throttling and a transactional email outbox with asynchronous retries.

Configure `FRONTEND_URL` to the deployed HTTPS frontend origin, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH=true` and `SMTP_STARTTLS=true` for an authenticated STARTTLS provider. Keep credentials in deployment secrets. Mailpit is for local development only. The application does not load shell-style `.env` files automatically; use environment variables or the ignored local properties file. Monitor mail delivery warnings separately; mail availability is excluded from readiness so an email provider outage does not take down the portal.

Public POST endpoints: `/api/auth/forgot-password` (`email`), `/api/auth/reset-password` (`token`, `password`), `/api/auth/verify-email` (`token`). Resend is authenticated POST `/api/account/email-verification/resend`. Responses use `no-store`; invalid, expired and consumed links return 400. Swagger documents these endpoints when API documentation is enabled.

This change introduces Flyway migration V4. Existing accounts start with unverified email addresses and can request verification after signing in. No identity verification or content API behavior is changed.
