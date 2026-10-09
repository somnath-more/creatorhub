# Content drafts

## Scope

Create, list, edit, and delete private drafts using a local repository. The create
and edit forms use React Hook Form with a Zod resolver. Publishing, scheduling,
upload progress, backend integration, and authentication belong to later milestones.

## Data and validation

- Title: trimmed, required, maximum 120 characters.
- Description: trimmed, required, maximum 5,000 characters.
- Price: USD, 0 through 999,999.99, maximum two decimal places. Stored as integer cents.
- Thumbnail: optional for drafts; nonempty JPG, PNG, or WebP, maximum 5 MiB.
- Video: optional for drafts; nonempty MP4, WebM, or MOV, maximum 2 GiB.
- Publication status: always DRAFT; no publish action is exposed.

These limits are initial demo choices, not production upload guarantees. File type
and size checks are client-side conveniences; production requires server-side file
inspection. Selected media is not uploaded, transcoded, or validated as playable video.

Metadata is stored under `creatorhub.drafts.v1` in localStorage. This is a single-user
demo within one browser, without cross-tab conflict resolution or account isolation.
Do not use it to store real private creator content. The asynchronous repository
interface provides a boundary for replacing local persistence with authenticated APIs.

Files stay in a session-only in-memory map. Thumbnail object URLs are revoked when
previews unmount or change. Reloading preserves metadata and file names, but the
creator must reselect media. No large file is serialized to localStorage.

## UX and errors

Successful saves redirect to Content with feedback. A storage failure keeps entered
values on the form and shows an error. Invalid stored data is not silently erased.
The library includes loading, empty, retry, and success states. Deletion requires an
explicit inline confirmation; cancelling preserves the draft. Missing edit targets
provide a recovery link. Drafts appear with the most recently updated first.

## Verification commands

Run from `frontend`:

```powershell
npm test
npm run lint
npm run build
```

Interaction tests cover creation, validation, edit, reload persistence, cancellation
and confirmation of deletion, save errors, corrupt storage, missing targets, media
validation, preview cleanup, and media reselection messaging. Repository tests cover
exact cents, metadata persistence, invalid prices, corruption, and failed updates.

Before pushing, verify browser behavior at mobile, tablet, and desktop widths.
User approval is required before pushing this branch or opening its GitHub PR.
