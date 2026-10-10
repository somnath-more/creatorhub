# PR 13: creator content and identity workflow

## Outcome
The existing creator portal will use authenticated Spring APIs and PostgreSQL for
content and verification progress. Creators can save drafts immediately; only a
server-side VERIFIED identity record permits publishing or scheduling. Email
verification remains independent. Actual video and identity bytes are simulated.

## Boundaries
Keep controller, service/interface/impl, model, DTO, config, exception and
repository packages. Flyway V5 adds creator-owned content and one verification
record per creator. Ownership always derives from the validated JWT subject,
never request creator IDs. Missing and foreign content return the same 404.
Media metadata is validated and persisted; no arbitrary remote URLs or bytes are
accepted. Client upload completion is a simulation flag, not production evidence.

## Content contract
GET/POST /api/content; GET/PUT/DELETE /api/content/{id}; POST
/api/content/{id}/publish and /schedule. Prices are integer USD cents, 0..99999999.
Title and description limits match the UI. Writes lock the creator row; content
versions prevent stale edits/publish/delete (409). Editing any status returns it
to DRAFT, clears readiness/publication dates and cancels a schedule. Explicit
publication requires persisted verification, both validated media descriptors,
and the completed simulation flag. Future dates must be valid Instants.

Listing is owner-scoped, ordered by update time. Existing title search, status
filtering and demo metric sorting remain in the UI. This assessment listing is
not designed for arbitrarily large creator libraries; paginated queries and UI
are a later scaling improvement. Views, purchases and revenue stay labeled demos.

## Verification contract
GET/PUT /api/verification persists step progress. The server validates personal
data before step 2, identification type and simulated document selection before
step 3, and simulated document/selfie selection before submission. Submitted and
verified records cannot be edited back into an unfinished state. The server
assigns submission/approval timestamps; request bodies cannot set VERIFIED.
POST /api/verification/demo-approval can approve only SUBMITTED, and only with
DEMO_VERIFICATION_ENABLED=true (default false). Responses expose whether the demo
control is enabled so the UI can explain pending review without offering it.
Fictional details only; no real identity technology or admin review is claimed.

## Scheduling and consistency
A backend scheduler checks due ready content in bounded batches every 15 seconds.
It uses PostgreSQL row locking with SKIP LOCKED and rechecks persisted verification.
Schedules continue while browsers are closed. Editing/deletion cancels them.
Multiple workers may run safely; no exactly-at-the-second publication guarantee.

## Frontend and failure behavior
Replace production localStorage repositories with API adapters using the existing
refresh/session-aware auth client. Preserve legacy local data without importing
it. Files and previews remain session-only and require reselection after reload.
Existing loading, empty, error, validation, retry, deletion confirmation and
success feedback stay. API failures preserve form values; stale writes explain
that the page must be reopened. Never silently fall back to browser persistence.

## Validation
Real PostgreSQL tests cover ownership, validation, status transitions, verification
gate, demo-disabled behavior, due scheduling, cancellation and stale writes.
Frontend API and integrated UI tests cover transport, safe errors, persistence
after reload and verification blocking. Legacy UI tests may use explicitly
test-only repository fixtures; those fixtures are excluded from production.
Run backend verification, frontend tests/lint/build and a local HTTP smoke flow.
One independent read-only review precedes completion. Ask before pushing.
