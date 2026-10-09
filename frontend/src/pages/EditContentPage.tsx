import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DraftForm } from "../features/content/DraftForm";
import { draftRepository } from "../features/content/draftRepository";
import type { Draft } from "../features/content/draftSchema";
import { Button } from "../components/atoms/Button";

export function EditContentPage() {
  const { id = "" } = useParams();
  const [state, setState] = useState<{
    id: string;
    draft?: Draft;
    error?: string;
  }>();
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    draftRepository
      .get(id)
      .then((draft) => {
        if (active) setState({ id, draft });
      })
      .catch((error) => {
        if (active) setState({ id, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [id, reload]);
  if (!state || state.id !== id) return <p role="status">Loading draft…</p>;
  if (state.error)
    return (
      <div role="alert">
        <h1 className="text-3xl font-bold">Unable to load draft</h1>
        <p className="mt-4 text-red-700">{state.error}</p>
        <Button
          className="mt-4"
          onClick={() => setReload((value) => value + 1)}
        >
          Try again
        </Button>
      </div>
    );
  if (!state.draft)
    return (
      <>
        <h1 className="text-3xl font-bold">Draft not found</h1>
        <p className="mt-4 text-slate-500">
          This draft may have been deleted or saved in another browser.
        </p>
        <Link
          to="/content"
          className="mt-4 inline-flex min-h-11 items-center font-semibold text-violet-700"
        >
          Back to content
        </Link>
      </>
    );
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Edit draft
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Keep refining your idea. Changes are saved when you select Save draft.
      </p>
      <DraftForm key={state.draft.id} draft={state.draft} />
    </>
  );
}
