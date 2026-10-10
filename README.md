# CreatorHub — Creator Portal assessment

React + TypeScript creator portal with a separate Spring Boot monolith. The
reviewer demo runs **entirely in the browser**; no backend, Docker, database,
login or cloud credentials are required.

- [Live frontend demo](https://creatorhub-one-amber.vercel.app)
- [Source repository](https://github.com/somnath-more/creatorhub)
- [Deployment / reviewer PR #13](https://github.com/somnath-more/creatorhub/pull/13)
- [Technical design, architecture diagrams, scale and cost model](docs/technical-design.md)
- [AI usage disclosure](AI-USAGE.md)
- [Vercel configuration](frontend/docs/vercel-deployment.md)

PR #13 is stacked on `feat/creator-content-api`. For review before merge, check
out `deployment-vercel`; after merging, use `main`. Repository owners must ensure
reviewers can access the repository (public visibility or explicit collaborator
access); the demo URL does not grant source access.

## Local setup — frontend-only demo

Prerequisite: Node.js 22.14+ (Node 24 LTS recommended) and npm. Install Git to
clone. No paid account or environment secret is needed.

```powershell
git clone https://github.com/somnath-more/creatorhub.git
cd creatorhub
git switch deployment-vercel
cd frontend
npm ci
$env:VITE_DEMO_MODE = 'true'
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. If that port is
occupied Vite prints another port. For macOS/Linux use
`VITE_DEMO_MODE=true npm run dev -- --host 127.0.0.1` instead of the last two lines.
The variable is explicit: without demo mode the app expects the Spring API.

For a local production build and preview in the same shell:

```powershell
$env:VITE_DEMO_MODE = 'true'
npm run build
npm run preview -- --host 127.0.0.1
```

Vite embeds the mode at build time; setting the variable only for preview does
not change an already built bundle. Production/Preview Vercel environments are
configured with `VITE_DEMO_MODE=true`.

## What reviewers can try

- Dashboard: total revenue, revenue this month, content and purchase counts,
  revenue chart, purchase search by content/country/status and pagination (newest first).
- Content: search, status filters, sorting, thumbnail placeholders, price,
  views/purchases/revenue, view/edit/delete with confirmation.
- Create/edit: required title/description, USD price validation, thumbnail/video
  selection, simulated upload progress/retry, save success/error feedback.
- Publishing: unverified demo creators can save drafts; publishing/scheduling
  requires the four-step simulated identity flow and explicit demo approval.
- Responsive navigation and layout for desktop, tablet and mobile.

Open **Demo controls** above the page content:

| Control / route | Result |
|---|---|
| Reset sample data | Confirms replacement, restores 12 content records and 30 purchases, clears identity progress |
| Start with empty data | Confirms replacement, keeps content/purchases empty until reset |
| `/?demo=empty` | No-purchase dashboard; existing content is retained |
| `/?demo=error` | Dashboard error with retry / return-to-sample action |
| `/content?analytics=sample` | Synthetic performance metrics for published content |
| `/content?analytics=error` | Analytics error and recovery controls |
| `/content?analytics=empty` | Zero performance metrics |

Loading indicators appear during asynchronous operations; browser network/CPU
throttling can make transitions easier to inspect. Validation errors can be
shown by submitting an empty form. Success feedback appears after saving;
delete and reset actions require confirmation. Error controls remain errors
until returning to normal mode; retries do not silently remove a forced error.

## Synthetic seed data and persistence

[seedData.ts](frontend/src/demo/seedData.ts) creates **12 videos** (4 Published,
4 Draft, 4 Scheduled) and **30 purchases** across Completed, Pending and Failed
statuses, six countries and dates spanning current/prior month. Purchase titles
refer to published seed content. There are no real customers or media files.
Sample thumbnails/video metadata are placeholders; select actual local files
to exercise simulated upload/publishing. Never upload real identity documents.

On first access missing data keys are seeded. Content changes, purchase dates
and verification progress persist in localStorage through refresh, browser
restart and development-server restart, on the same browser profile/origin.
Clearing site storage or using another browser/origin starts a separate demo.
Explicit empty arrays stay empty; deleted records are not silently reseeded.
Corrupt data is reported rather than overwritten. Use Reset sample data to
recover intentionally. After this seed update, existing browsers with saved
content must choose reset to receive the full sample dataset.

Selected File objects, previews, upload progress and evidence files are held
in session memory and disappear on reload. Scheduling is simulated: due content
is reconciled when content is loaded (and periodically while the library is
open), not by an always-running server. Reset also reloads the page, clearing
session media. Reset affects only the demo's scoped keys, not unrelated storage.

## Tests

From `frontend`, in a **fresh shell with VITE_DEMO_MODE unset** (tests choose
API/demo fixtures explicitly):

```powershell
Remove-Item Env:VITE_DEMO_MODE -ErrorAction SilentlyContinue
npm ci
npx vitest run --maxWorkers=1
npm run test:deployment
npm run lint
$env:VITE_DEMO_MODE = 'true'
npm run build
```

On macOS/Linux use `unset VITE_DEMO_MODE` and `export VITE_DEMO_MODE=true`.
One worker avoids workflow timeouts on resource-constrained machines; the
standard `npm test` also works when enough CPU is available. Tests cover money
validation, content CRUD/recovery, publication rules, uploads, verification,
auth transport/API mode, analytics, frontend-only operation and seed integrity.
Deployment checks verify SPA/API routing and backend/demo configuration guards.

Optional backend tests from `backend/creatorhub` (JDK 17+, Docker for integration):

```powershell
.\mvnw.cmd test
.\mvnw.cmd -Pintegration verify
```

Integration tests start disposable PostgreSQL Testcontainers; do not point tests
at a production database. Backend setup and API-mode instructions are in
[backend README](backend/creatorhub/README.md),
[sessions](backend/creatorhub/docs/sessions.md) and
[content API](backend/creatorhub/docs/content-api.md). The backend is excluded
from the frontend-only demo setup.

## Assumptions and limitations

This is a single-browser fictional creator demo in USD. Demo mode bypasses
account authentication; browser verification is editable and not a security
boundary. Identity checks, uploads, sales and performance metrics are simulated.
No real payment, refund, payout, R2 upload, video processing, streaming, DRM,
cross-device synchronization or production identity provider is implemented.
Dashboard purchases and content performance are separate fixtures; totals are
not a reconciled financial ledger. Frontend storage is not suitable for secrets.
The optional backend has real ownership/publishing rules but is not deployed
or needed here. Technical-design infrastructure is a proposal, not provisioned.

## Approximate time spent

Development was completed iteratively with substantial AI assistance. Human
working time was not tracked, so a defensible total is currently unavailable.
The owner is being asked for an approximate total before submission; calendar
commit spans and AI tool runtime are not a substitute for human effort hours.
See AI-USAGE.md for disclosure.

## Next priorities

1. Connect the deployed portal to the Spring API with production configuration,
   SMTP, backups and verification policy; keep demo mode explicit and separate.
2. Implement private resumable R2 uploads and asynchronous media processing,
   with entitlement-controlled playback and upload recovery.
3. Unify purchase/content analytics into one ledger and add refunds/fees/payout
   visibility; expand accessibility and end-to-end coverage for real API mode.

The current live demo is optional for assessment: the local commands above are
the supported reviewer path and work without deployment accounts.
