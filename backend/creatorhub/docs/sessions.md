# Browser sessions and local testing

Registration/login from the previous milestone now support browser sessions.
Refresh tokens are opaque random values in an HttpOnly cookie; only SHA-256 hashes
are stored. Access JWTs stay in React memory, last 15 minutes and include a session
ID. Sessions expire seven days after login, without sliding renewal. Every Bearer
request checks that session in PostgreSQL, so logout revokes access immediately.

## Start locally in PowerShell

From backend/creatorhub, set your existing dedicated database credentials and
generate APP_JWT_SECRET as described in authentication.md. Then:

```powershell
$env:SPRING_PROFILES_ACTIVE = 'dev'
# Explicitly allow cookies over HTTP on your local machine only.
$env:APP_AUTH_COOKIE_SECURE = 'false'
.\mvnw.cmd spring-boot:run
```

In another terminal, from frontend:

```powershell
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies /api to http://127.0.0.1:8080. Use one
hostname consistently; localhost and 127.0.0.1 have different browser cookies.
Register, sign in, reload, and sign out. Protected routes redirect to login;
successful login restores the requested internal route. Offline bootstrap shows
retry feedback. Failed logout shows an error rather than claiming revocation.

Deployment uses the same HTTPS origin for frontend and /api, Secure cookies (the
default), explicit CORS origins, and SPA fallback routing for direct page links.
Do not use the local insecure-cookie setting in deployment. Unrelated frontend
and API sites are outside this SameSite=Lax setup.

## Endpoints and Swagger

| Endpoint | Behavior |
| --- | --- |
| GET /api/auth/csrf | Initializes readable XSRF-TOKEN cookie; no-store |
| POST /api/auth/register | Existing account creation; no refresh session yet |
| POST /api/auth/login | Access-token JSON plus HttpOnly creatorhub-refresh cookie |
| POST /api/auth/refresh | Consumes refresh token, rotates cookie, returns access-token JSON |
| POST /api/auth/logout | Revokes current session and clears cookie; idempotent 204 |
| GET /api/me | Bearer authentication and active session required; no-store |

Login/refresh/logout require the X-XSRF-TOKEN header matching the CSRF cookie.
Refresh and logout use the browser's refresh cookie; do not supply it in JSON.
Cookie flags: HttpOnly, SameSite=Lax, Path=/api/auth, Secure by default, no Domain.
CSRF cookie is deliberately readable by JavaScript. Exact-origin credentialed
CORS allows X-XSRF-TOKEN. Business endpoints authenticate only Bearer tokens.

Swagger at http://localhost:8080/swagger-ui/index.html is enabled only with dev.
Execute GET /api/auth/csrf first. Swagger's CSRF support reads the cookie and adds
the header for subsequent writes. Register and log in, then paste accessToken
into Authorize for /api/me. Refresh uses the cookie automatically. Logout revokes
the session; the previous access token now receives 401. Registration and refresh
do not require Bearer authorization.

For PowerShell API testing, preserve cookies and add CSRF explicitly:

```powershell
$creatorWebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest http://localhost:8080/api/auth/csrf -WebSession $creatorWebSession -UseBasicParsing | Out-Null
$creatorCsrf = $creatorWebSession.Cookies.GetCookies('http://localhost:8080/')['XSRF-TOKEN'].Value
$creatorLogin = @{email='demo@example.com';password='demo-password-123'} | ConvertTo-Json
$creatorSession = Invoke-RestMethod http://localhost:8080/api/auth/login -Method Post -WebSession $creatorWebSession -Headers @{'X-XSRF-TOKEN'=$creatorCsrf} -ContentType application/json -Body $creatorLogin
Invoke-RestMethod http://localhost:8080/api/me -Headers @{Authorization="Bearer $($creatorSession.accessToken)"}
Invoke-RestMethod http://localhost:8080/api/auth/logout -Method Post -WebSession $creatorWebSession -Headers @{'X-XSRF-TOKEN'=$creatorCsrf}
```

## Rotation, concurrency and limits

Session-row locking serializes refresh and logout across backend instances. A
consumed token replay revokes its entire session; that revocation commits even
though the HTTP result is 401. Separate logins/devices have independent sessions.
The client deduplicates refresh within one tab, including StrictMode startup.
It retries an API request once after 401; 403 never triggers refresh. Pending
login and refresh finish before logout revokes the latest cookie. Stale API
results cannot update a later account.

Strict replay protection can sign out two tabs that refresh simultaneously. A
lost refresh response can similarly require login. Cross-tab refresh coordination
is deferred. Existing JWTs without sid require login after migration. Tokens and
session rows remain until expiry for replay detection; operations should prune
expired sessions (refresh rows cascade) with a scheduled maintenance job. This PR
does not install that job. Session validation adds a database lookup per Bearer
request; shared revocation caching would need careful consistency at higher scale.

Content and verification progress now persist through creator-owned APIs.
Simulated file bytes stay in account-scoped browser memory.
Anonymous legacy demo records remain untouched and are not adopted by accounts.
Browser media scoping is UX isolation, not secure storage. Password reset and email verification
are implemented; see [account recovery](account-recovery.md). Backend-owned content
and verified publishing are implemented; see [content APIs](content-api.md).

References: [Spring Security SPA CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html),
[springdoc CSRF properties](https://springdoc.org/properties.html).
