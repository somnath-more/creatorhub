# Simulated media uploads

## Creator flow

Selecting a valid thumbnail or video starts an independent five-second upload
simulation. Each file shows an accessible progress bar and Waiting, Uploading,
Completed, Failed, or Cancelled state. No file is read or sent over the network.

Creators can cancel an active simulation or explicitly simulate failure. Offline
browser status also fails the next progress tick. Retry starts again at zero;
this demo does not implement resumable or multipart uploads. Replacement files
cancel the previous simulation and start a new one. Existing file validation
remains unchanged (thumbnail up to 5 MB; video up to 2 GB).

Drafts remain saveable without media or completed uploads. Simulations continue
when navigating inside the app, and their controls are available on the content
detail page as well as in the editor. A browser reload loses files and upload
state: saved filenames remain, and the editor asks creators to reselect files.

Publishing and scheduling independently require valid saved media, completed
simulations for the exact selected File objects, and verified demo status. A
replacement file with identical metadata does not inherit completion. Already
scheduled or published records retain their established readiness after reload;
editing returns them to Draft and publishing checks the current session again.

## Implementation boundary

`uploadService.ts` defines the UploadService interface and timer-based adapter.
It keeps immutable state snapshots in a WeakMap keyed by File and exposes a
subscription consumed by React's useSyncExternalStore. Timers stop on completion,
cancellation, failure, and replacement. State is shared across routes but never
serialized into localStorage. No additional dependency is required.

`MediaUploadProgress.tsx` renders status and recovery controls. `DraftForm.tsx`
starts simulations; `publicationRules.ts` enforces completion at the repository
boundary. Simulate-failure controls are explicitly labeled as demo actions.

For production, replace the adapter with server-authorized direct object-storage
uploads and authoritative upload IDs, progress, retries, and resumable state.
The backend must validate ownership, file contents, upload completion, processing
readiness, and publishing authorization. Local completion is not a security rule.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` from `frontend`.
Tests cover progress, completion, cancellation, offline failure, explicit failure,
retry, route remounts, exact-file readiness, replacement, and saving during upload.
Check the workflow at mobile, tablet, and desktop widths and confirm reload
recovery. Ask for approval before pushing the branch or creating its GitHub PR.
