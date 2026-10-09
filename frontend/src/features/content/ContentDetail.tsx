import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { draftRepository } from "./draftRepository";
import { formatPrice, type Draft } from "./draftSchema";
import { getSessionMedia } from "./sessionMedia";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { ContentStatus } from "./ContentStatus";
import { VerificationRequiredError } from "./publicationRules";

export function ContentDetail() {
  const { id = "" } = useParams();
  const [state, setState] = useState<{
    id: string;
    content?: Draft;
    error?: string;
  }>();
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    let active = true;
    draftRepository
      .get(id)
      .then((content) => {
        if (active) setState({ id, content });
      })
      .catch((reason) => {
        if (active) setState({ id, error: reason.message });
      });
    return () => {
      active = false;
    };
  }, [id, reload]);

  const scheduled = state?.content?.status === "SCHEDULED";
  useEffect(() => {
    const refresh = () => setReload((value) => value + 1);
    const timer = scheduled ? window.setInterval(refresh, 15000) : undefined;
    window.addEventListener("focus", refresh);
    return () => {
      if (timer) window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [scheduled]);

  async function publish(scheduleDate?: string) {
    setBusy(true);
    setError("");
    setMessage("");
    setBlocked(false);
    try {
      const content =
        scheduleDate === undefined
          ? await draftRepository.publish(id)
          : await draftRepository.schedule(id, scheduleDate);
      setState({ id, content });
      setMessage(
        content.status === "PUBLISHED"
          ? "Content published in this local demo."
          : "Publication scheduled in this local demo.",
      );
    } catch (reason) {
      if (reason instanceof VerificationRequiredError) setBlocked(true);
      else
        setError(
          reason instanceof Error
            ? reason.message
            : "Publication failed. Try again.",
        );
    } finally {
      setBusy(false);
    }
  }

  if (!state || state.id !== id) return <p role="status">Loading content...</p>;
  if (state.error)
    return (
      <div role="alert">
        <h1 className="text-3xl font-bold">Unable to load content</h1>
        <p className="mt-3 text-red-700">{state.error}</p>
        <Button
          className="mt-4"
          onClick={() => setReload((value) => value + 1)}
        >
          Try again
        </Button>
      </div>
    );
  if (!state.content)
    return (
      <>
        <h1 className="text-3xl font-bold">Content not found</h1>
        <Link
          to="/content"
          className="mt-4 inline-flex min-h-11 items-center text-violet-700"
        >
          Back to content
        </Link>
      </>
    );
  const content = state.content;
  const media = getSessionMedia(id);
  const mediaReady = !!media.thumbnail && !!media.video;
  return (
    <>
      <Link
        to="/content"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700"
      >
        Back to content
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-tight">
            {content.title}
          </h1>
          <div className="mt-3">
            <ContentStatus status={content.status} />
          </div>
        </div>
        <Link
          to={`/content/${id}/edit`}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"
        >
          Edit content
        </Link>
      </div>
      <p className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
        Local publishing demo only. Selected files simulate media readiness; no
        video is uploaded, processed, or delivered to viewers.
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
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {blocked && (
        <section
          aria-label="Verification required"
          className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          <h2 className="font-semibold text-amber-900">
            Verify your account to publish
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Your draft is safe. Complete verification, then simulate approval to
            enable demo publishing and scheduling.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={`/verification?returnTo=${encodeURIComponent(`/content/${id}`)}`}
              className="inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
            >
              Start verification
            </Link>
            <Button onClick={() => setBlocked(false)}>
              {content.status === "DRAFT"
                ? "Keep as draft"
                : "Keep current status"}
            </Button>
          </div>
        </section>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Content details</h2>
          {media.thumbnail ? (
            <ThumbnailPreview
              file={media.thumbnail}
              className="mt-4 aspect-video w-full rounded-xl object-cover"
            />
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
              {content.thumbnail
                ? "Reselect the thumbnail in the editor to restore its preview."
                : "No thumbnail selected."}
            </p>
          )}
          <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {content.description}
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Price</dt>
              <dd className="mt-1 font-semibold">
                {formatPrice(content.priceCents)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Video</dt>
              <dd className="mt-1 break-all">
                {content.video?.name ?? "No video selected"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Media readiness</dt>
              <dd className="mt-1">
                {content.mediaStatus === "READY"
                  ? "Ready for demo (selection recorded)"
                  : mediaReady
                    ? "Files selected for demo publishing"
                    : "Reselect and save media before publishing"}
              </dd>
            </div>
            {content.scheduledAt && (
              <div>
                <dt className="text-slate-500">Scheduled publication</dt>
                <dd className="mt-1">
                  <time dateTime={content.scheduledAt}>
                    {new Date(content.scheduledAt).toLocaleString()}
                  </time>
                </dd>
              </div>
            )}
            {content.publishedAt && (
              <div>
                <dt className="text-slate-500">Published</dt>
                <dd className="mt-1">
                  <time dateTime={content.publishedAt}>
                    {new Date(content.publishedAt).toLocaleString()}
                  </time>
                </dd>
              </div>
            )}
          </dl>
        </section>
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Publication</h2>
          {content.status === "PUBLISHED" ? (
            <p className="mt-4 text-sm leading-6 text-emerald-800">
              This content is published in the local demo. Editing and saving
              will return it to Draft.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Publish now or choose a future date. Both actions require demo
                approval and selected media.
              </p>
              <Button
                variant="primary"
                className="mt-5"
                disabled={busy}
                onClick={() => void publish()}
              >
                {busy ? "Saving..." : "Publish now"}
              </Button>
              <div className="mt-7 border-t border-slate-200 pt-6">
                <label
                  htmlFor="publication-date"
                  className="block text-sm font-semibold"
                >
                  Publication date and time
                </label>
                <input
                  id="publication-date"
                  type="datetime-local"
                  value={schedule}
                  disabled={busy}
                  onChange={(event) => setSchedule(event.target.value)}
                  className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Choose a future time in your device timezone.
                </p>
                <Button
                  className="mt-4"
                  disabled={busy}
                  onClick={() => {
                    const date = new Date(schedule);
                    void publish(
                      Number.isFinite(date.getTime())
                        ? date.toISOString()
                        : "invalid",
                    );
                  }}
                >
                  Schedule publication
                </Button>
              </div>
            </>
          )}
          <p className="mt-6 text-xs leading-5 text-slate-500">
            Demo schedules are checked every 15 seconds on this page and the
            content list, and when the app reads content again. A closed browser
            cannot publish at the exact scheduled time; reliable scheduling
            requires the future backend.
          </p>
        </section>
      </div>
    </>
  );
}
