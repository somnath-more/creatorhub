# Content publishing and scheduling demo

## Scope

Content now supports Draft, Published, and Scheduled for Publication. A detail
route (`/content/:id`) provides View, Publish now, and Schedule publication actions.
The content list supports title search and status filtering through URL parameters.

The local content repository retains its existing draftRepository name and storage
key to preserve previous drafts. Older records default to NOT_READY media; no data
reset is required. Publication status and media readiness are separate fields.

## Publishing rules

- Creating and saving drafts requires no verification.
- Publishing and scheduling require VERIFIED demo status, valid saved content,
  and both a thumbnail and video selected in the current session.
- File metadata must match the selected files. MIME type, nonzero size, and existing
  upload-size limits are rechecked at the repository boundary.
- Stored filenames alone cannot satisfy media selection after a reload.
- The verification page exposes Simulate approval (demo) only for SUBMITTED status.
  Explicit approval persists VERIFIED with an approval timestamp; no real identity
  service, administrator, or backend authorization is implied.
- Unverified attempts keep the content unchanged and offer Start verification and
  Keep as draft. A safe local return link brings creators back to the content detail.
- Saving edits to published or scheduled content returns it to Draft and clears
  publication timestamps and schedules. The editor explains this beside the form
  and labels the action Save as draft.

The READY marker means that file selection was validated for the local demo, not
that media was uploaded, transcoded, stored remotely, or made playable to viewers.
File bytes remain in memory; metadata and publication status survive reload.

## Scheduling

The UI accepts a future date/time in the device timezone and stores an ISO UTC
timestamp. The repository validates the calendar date and rejects past/present
times. A scheduled record retains the readiness marker established at scheduling.

Due records reconcile on repository reads (including reopening the app), every
15 seconds while the content list/detail displays scheduled content, and on window
focus. Reconciliation rechecks demo verification. It records actual reconciliation
time as publishedAt and retains scheduledAt as the originally requested time.

A closed or throttled browser cannot guarantee on-time publication. Production
requires a server scheduler with durable jobs, transaction-safe status transitions,
server-side identity/ownership checks, and media processing readiness.

## Application states and verification

Includes loading, missing-content recovery, verification blocking, media readiness
errors, invalid schedules, successful actions, and storage-error feedback. Failed
writes do not mutate stored publication state. Deletion keeps explicit confirmation
and cancels schedules; search/filter combinations provide a no-results state.

From `frontend`, run `npm test`, `npm run lint`, and `npm run build`. Tests cover
verification gates, explicit approval, selected-media requirements, schedule date
validation, due processing, approval rechecks, edit-to-draft behavior, write failure,
and search/filter interactions. Verify the complete flow in mobile/tablet/desktop
browsers and confirm publication remains persisted after reload.

This is a single-user local demo. Browser data can be modified by the user and is
not a security boundary. Backend integration must independently enforce every rule.
Push and GitHub PR creation require user approval after local verification.
