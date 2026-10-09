import { DraftForm } from "../features/content/DraftForm";

export function CreateContentPage() {
  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
        Your workspace
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Create content
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Start with a draft. Make it yours before you publish.
      </p>
      <DraftForm />
    </>
  );
}
