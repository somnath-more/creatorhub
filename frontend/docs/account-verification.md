# Account verification demo

## Scope

The `/verification` page provides four responsive steps: personal information,
sample identity document, sample selfie check, and submission confirmation.
It uses the existing React Hook Form, Zod, and shared button components.

States are NOT_STARTED, IN_PROGRESS, SUBMITTED, and VERIFIED (demo). Submission
does not unlock publishing. The publishing milestone adds an explicitly labelled
Simulate approval (demo) action for submitted verification. The future backend must
enforce verified status independently of this local demonstration.

## Validation and persistence

- Full name: required, trimmed, maximum 100 characters.
- Date of birth: required, valid calendar date strictly before today. No age policy is assumed.
- Country: required, trimmed, maximum 80 characters; free text supports all countries.
- Identification type: passport, national identity card, or driving licence.
- Document: required to advance, nonempty JPG/PNG/PDF, maximum 10 MiB.
- Selfie: required to submit, nonempty JPG/PNG, maximum 10 MiB.

File validation checks declared MIME type and size for demo UX only. It does not
inspect file contents, establish authenticity, or run facial recognition.

Local progress under `creatorhub.verification.v1` contains the step, status,
fictional personal details, identification type, submission timestamp, and optional
demo approval timestamp. Progress
is saved when continuing or going back, not on every keystroke. Storage errors
preserve the current form; corrupted saved data is reported without being erased.

Identity files stay in component memory and are never uploaded or serialized.
Leaving the page or reloading discards them. A resumed identity check returns to
document selection so the creator can reselect sample evidence. Submission clears
the in-memory evidence. The submitted confirmation survives reload.

Progress is now scoped to the signed-in account through the authentication PR;
there is no cross-tab synchronization or backend verification storage. See
[authentication](authentication.md). Use fictional information and sample files only. Production identity
data requires a separate secure backend and retention policy; browser storage here
is not a production identity-data store.

## UX and checks

The page includes loading, retry, step validation, saved-progress feedback, back
navigation, an accessible ordered step indicator, focus movement to step headings,
and explicit confirmation distinguishing submission from verification.

Run from `frontend`: `npm test`, `npm run lint`, and `npm run build`.
Verify the full workflow at mobile, tablet, and desktop widths, including file
reselection after reload and successful submitted-state persistence.

Push and GitHub PR creation require user approval after local verification.
