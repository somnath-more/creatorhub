# Creator content API and deployment demo

PR 13 connects content and identity progress to PostgreSQL. Flyway V5 runs on
startup. Old localStorage drafts/progress are preserved but are not imported.
Views, purchases and revenue are still labeled synthetic analytics.

## Run locally

Start PostgreSQL/Mailpit and the application using the session/recovery guides.
For a complete fictional assessment walkthrough, explicitly enable demo approval
in the backend shell before starting Spring Boot:

```powershell
$env:DEMO_VERIFICATION_ENABLED = 'true'
$env:SPRING_PROFILES_ACTIVE = 'dev' # Local Swagger testing only.
.\mvnw.cmd spring-boot:run
```

Start Vite from `frontend` with `npm run dev`; its `/api` proxy targets backend
port 8080. Sign up/sign in, save a draft, open it and attempt to publish. The
verification prompt preserves the draft and links back to it after verification.
Complete the four steps using fictional details and sample files, submit, then
choose **Simulate approval (demo)**. Select thumbnail/video in the content editor,
wait for both simulated upload indicators to complete and save. Publish or
schedule from the detail page. Reloading retains metadata and publication state.
File bytes/previews require reselection after reload; videos are not streamed.

Default `DEMO_VERIFICATION_ENABLED=false` hides approval and rejects its endpoint
with 403. Submission alone does not unlock publication. Approval is an assessment
simulation, never a production identity system. Real approval/review is outside
this PR. Email verification does not imply identity verification.

## API

All endpoints require the existing creator Bearer token. Swagger is available at
`/swagger-ui/index.html` in the `dev` profile. Use Authorize with the access token.
Authentication's existing CSRF flow still applies to login/refresh/logout.
Content endpoints use Bearer authorization and do not authenticate via cookies.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/content` | List only the signed-in creator's content |
| POST | `/api/content` | Create a draft; media optional |
| GET | `/api/content/{id}` | Read owned content |
| PUT | `/api/content/{id}` | Replace draft fields, reset status and cancel schedule |
| DELETE | `/api/content/{id}?version=0` | Delete owned content using the latest version |
| POST | `/api/content/{id}/publish` | Publish after persisted identity approval |
| POST | `/api/content/{id}/schedule` | Schedule a future publication |
| GET/PUT | `/api/verification` | Read/save creator verification progress |
| POST | `/api/verification/demo-approval` | Approve submitted simulation if enabled |

Create/update body:

```json
{"title":"Sample tutorial","description":"Fictional content","priceCents":1235,
 "thumbnail":{"name":"sample.png","size":100,"type":"image/png"},
 "video":{"name":"sample.mp4","size":1000,"type":"video/mp4"}}
```

For PUT also include the latest response `version`. Omitted optional media removes
its metadata; the UI retains existing metadata unless replaced. USD prices are
integer cents, 0..99999999. Titles are 1..120 characters; descriptions 1..5000.
Thumbnails allow JPEG/PNG/WebP up to 5 MiB; video MP4/WebM/QuickTime up to 2 GiB.
This validates descriptors only, not actual file signatures. Names are not paths
and no URL/file is fetched. Production readiness must come from trusted processing.

Publish body: `{"version":0,"mediaReady":true}`. Schedule additionally needs
`"scheduledAt":"2027-01-01T12:00:00Z"`. The flag represents completed **simulated**
uploads and cannot override persisted identity verification. Missing/foreign
content returns 404; unverified publishing returns 403 with
`IDENTITY_VERIFICATION_REQUIRED`; stale versions return 409. Reopen a stale page
before retrying. Validation errors use the existing safe ProblemDetail format.

Verification PUT uses `status` (`IN_PROGRESS`/`SUBMITTED`), `step` (1..4), `personal`
(`fullName`, `dateOfBirth`, `country`), `documentType`, and simulation booleans
`documentSelected`/`selfieSelected`. Advance one step at a time. The server assigns
timestamps and never accepts client VERIFIED state. Submitted records are final
for this assessment. No document/selfie bytes or names are sent or stored.

## Scheduling, concurrency and deployment

Backend checks run every 15 seconds in batches of 100. PostgreSQL SKIP LOCKED
coordinates workers, and due updates recheck identity verification and increment
content versions. The browser polls for updated status; it need not remain open.
An application outage delays publication until recovery. Editing/deletion cancels
the schedule. The scheduler's update and an interactive write can overlap; versions
reject stale edits so they cannot overwrite a due publication silently.

For a deployed demo, serve the built Vite assets with SPA fallback and proxy `/api`
to Spring Boot under the same HTTPS origin. Set database, JWT, frontend origin and
SMTP secrets as documented in authentication/recovery setup. Keep secure cookies
enabled. Demo approval must be explicitly enabled only for fictional assessment
accounts/data; disable Swagger outside controlled testing. No infrastructure or
deployment is provisioned by this PR.

Listing/search/filter/sort currently load the creator's library into the UI.
Large libraries need paginated API queries and a paginated UI; this is an MVP
limit. No real payments, video storage/transcoding/CDN or identity provider is
implemented. Browser repository fixtures exist only under `src/test` for legacy
UI regression coverage; production repositories always call the API.
