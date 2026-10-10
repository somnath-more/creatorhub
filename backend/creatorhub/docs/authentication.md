# Authentication and Swagger testing

Run commands from `backend/creatorhub` with Java 17 and your dedicated PostgreSQL
database available. Use the datasource settings from the backend README. To use
your existing container, set DATABASE_URL, DATABASE_USERNAME and DATABASE_PASSWORD
to its database credentials; you do not need a second Compose database.

Generate a signing key in PowerShell without printing it:

```powershell
$authKeyBytes = New-Object byte[] 32
$authRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$authRng.GetBytes($authKeyBytes)
$authRng.Dispose()
$env:APP_JWT_SECRET = [Convert]::ToBase64String($authKeyBytes)
$env:SPRING_PROFILES_ACTIVE = 'dev'
.\mvnw.cmd spring-boot:run
```

Keep the same key across restarts if existing tokens should remain valid. Store
deployment keys in a secret manager. Missing, malformed or short keys fail startup.
The key above exists only in this shell and child processes. Never commit it.
Flyway applies V2 automatically; do not manually recreate existing tables.

Open http://localhost:8080/swagger-ui/index.html.

1. Expand `POST /api/auth/register`, select **Try it out**, and enter:

   ```json
   {"fullName":"Demo Creator","email":"demo@example.com","password":"demo-password-123"}
   ```

   Execute: expect 201 and user/creator IDs. This example password is for local
   testing only. Repeating registration returns 409.
2. Execute `POST /api/auth/login` with the same email and password. Expect 200.
3. Copy `accessToken`, click **Authorize**, paste only the token (without the
   `Bearer ` prefix), authorize and close the dialog.
4. Execute `GET /api/me`. Expect your profile. Logout from Swagger's authorization
   dialog and repeat: expect 401. Swagger does not persist authorization on reload.

Email is trimmed and lowercased; names are trimmed. Registration passwords need
12 characters and must fit within 72 UTF-8 bytes. Passwords are never trimmed.
Tokens expire after 15 minutes, with 30 seconds of validation clock tolerance.
Wrong-password and unknown-email login return the same generic 401.
Validation errors return 400 with field messages; responses never echo passwords.
Login responses use `Cache-Control: no-store`.

CLI alternative (no token printed):

```powershell
$authBody = @{fullName='Demo Creator';email='demo@example.com';password='demo-password-123'} | ConvertTo-Json
Invoke-RestMethod http://localhost:8080/api/auth/register -Method Post -ContentType application/json -Body $authBody
$authLoginBody = @{email='demo@example.com';password='demo-password-123'} | ConvertTo-Json
$authSession = Invoke-RestMethod http://localhost:8080/api/auth/login -Method Post -ContentType application/json -Body $authLoginBody
Invoke-RestMethod http://localhost:8080/api/me -Headers @{Authorization="Bearer $($authSession.accessToken)"}
```

Remove the dev profile for normal deployment: documentation is disabled by default.
Use HTTPS and controlled frontend origins. Do not expose the dev profile publicly.
This milestone has no refresh tokens, token revocation, password reset, email
verification, login throttling or frontend authentication integration. Logging
out locally discards the token but cannot revoke it before expiry. Add abuse
controls before public launch. Identity verification for publishing is separate
from login and will be implemented in a later PR.
