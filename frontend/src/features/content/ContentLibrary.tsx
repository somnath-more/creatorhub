import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Film, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { draftRepository } from "./draftRepository";
import { formatPrice, type Draft } from "./draftSchema";
import { getSessionMedia, removeSessionMedia } from "./sessionMedia";
import { ThumbnailPreview } from "./ThumbnailPreview";

export function ContentLibrary() {
  const location = useLocation();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string>(
    () => location.state?.message ?? "",
  );

  useEffect(() => {
    let active = true;
    draftRepository
      .list()
      .then((items) => {
        if (active) {
          setDrafts(items);
          setError("");
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [reload]);

  async function remove(id: string) {
    setDeleting(true);
    try {
      await draftRepository.remove(id);
      removeSessionMedia(id);
      setDrafts((previous) => previous.filter((draft) => draft.id !== id));
      setConfirmId(null);
      setMessage("Draft deleted.");
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your draft could not be deleted. Try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
            Your workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Content
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Your ideas, ready for their next chapter.
          </p>
        </div>
        <Link
          to="/content/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <Plus size={18} aria-hidden="true" />
          Create content
        </Link>
      </div>
      <p className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
        Local demo: drafts are saved in this browser only. Files stay in memory
        until a reload; their details remain saved.
      </p>
      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          <p>{error}</p>
          <Button
            className="mt-3"
            onClick={() => {
              setLoading(true);
              setReload((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      )}
      {loading ? (
        <p role="status" className="mt-8 text-sm text-slate-500">
          Loading drafts…
        </p>
      ) : !error && drafts.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Film
            size={36}
            className="mx-auto text-violet-600"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-xl font-semibold">No drafts yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Start with a title and a description. Add your media when you are
            ready.
          </p>
          <Link
            to="/content/new"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-violet-700"
          >
            Create your first draft
          </Link>
        </section>
      ) : null}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {drafts.map((draft) => {
          const thumbnail = getSessionMedia(draft.id).thumbnail;
          return (
            <article
              key={draft.id}
              className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="flex aspect-video items-center justify-center bg-slate-100">
                {thumbnail ? (
                  <ThumbnailPreview
                    file={thumbnail}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    <Film size={30} className="mx-auto" aria-hidden="true" />
                    <p className="mt-2 text-xs">
                      {draft.thumbnail
                        ? "Reselect thumbnail to preview"
                        : "No thumbnail selected"}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    Draft
                  </span>
                  <span className="text-sm font-semibold">
                    {formatPrice(draft.priceCents)}
                  </span>
                </div>
                <h2 className="mt-3 break-words text-lg font-semibold">
                  {draft.title}
                </h2>
                <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-500">
                  {draft.description}
                </p>
                <p className="mt-3 break-all text-xs text-slate-500">
                  {draft.video
                    ? `Video: ${draft.video.name}`
                    : "No video selected"}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/content/${draft.id}/edit`}
                    aria-label={`Edit ${draft.title}`}
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit draft
                  </Link>
                  <Button
                    aria-label={`Delete ${draft.title}`}
                    disabled={deleting}
                    onClick={() => {
                      setConfirmId(draft.id);
                      setMessage("");
                    }}
                    variant="danger"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </Button>
                </div>
                {confirmId === draft.id && (
                  <section
                    role="group"
                    aria-label={`Confirm deletion of ${draft.title}`}
                    className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4"
                  >
                    <p className="text-sm leading-6 text-red-900">
                      Delete this draft? This action cannot be undone.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        disabled={deleting}
                        onClick={() => setConfirmId(null)}
                      >
                        Keep draft
                      </Button>
                      <Button
                        disabled={deleting}
                        onClick={() => void remove(draft.id)}
                        variant="danger"
                      >
                        {deleting ? "Deleting…" : "Confirm delete"}
                      </Button>
                    </div>
                  </section>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
