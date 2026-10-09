import { VerificationWizard } from "../features/verification/VerificationWizard";

export function VerificationPage() {
  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
        Your workspace
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Verification
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Build trust and prepare your account for publishing.
      </p>
      <VerificationWizard />
    </>
  );
}
