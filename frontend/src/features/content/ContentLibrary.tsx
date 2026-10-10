import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Film, Plus } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { draftRepository } from "./draftRepository";
import type { Draft } from "./draftSchema";
import { removeSessionMedia } from "./sessionMedia";
import { ContentPerformanceTable } from "./ContentPerformanceTable";
import {
  contentAnalyticsRepository,
  type AnalyticsMode,
} from "./contentAnalyticsRepository";
import { sortContent, type MetricsById } from "./contentPerformance";

export function ContentLibrary() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const status = params.get("status") ?? "ALL";
  const requestedSort = params.get("sort") ?? "newest";
  const sort = ["newest", "revenue", "purchases", "views"].includes(requestedSort)
    ? requestedSort
    : "newest";
  const requestedAnalytics = params.get("analytics");
  const analyticsMode: AnalyticsMode = requestedAnalytics === "sample" || requestedAnalytics === "error"
    ? requestedAnalytics
    : "empty";
  const [analytics, setAnalytics] = useState<{
    content: Draft[];
    mode: AnalyticsMode;
    metrics?: MetricsById;
    error?: string;
  }>();
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

  useEffect(() => {
    let active = true;
    contentAnalyticsRepository
      .load(drafts, analyticsMode)
      .then((metrics) => {
        if (active) setAnalytics({ content: drafts, mode: analyticsMode, metrics });
      })
      .catch((reason) => {
        if (active) setAnalytics({
          content: drafts,
          mode: analyticsMode,
          error: reason instanceof Error ? reason.message : "Analytics could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [drafts, analyticsMode, reload]);
  const currentAnalytics = analytics?.content === drafts && analytics.mode === analyticsMode
    ? analytics
    : undefined;
  const metrics = currentAnalytics?.metrics;

  const hasScheduled = drafts.some((content) => content.status === "SCHEDULED");
  useEffect(() => {
    const refresh = () => setReload((value) => value + 1);
    const timer = hasScheduled ? window.setInterval(refresh, 15000) : undefined;
    window.addEventListener("focus", refresh);
    return () => {
      if (timer) window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [hasScheduled]);
  const visibleContent = sortContent(
    drafts.filter((content) =>
      content.title.toLowerCase().includes(query.trim().toLowerCase()) &&
      (!["DRAFT", "PUBLISHED", "SCHEDULED"].includes(status) || content.status === status),
    ),
    metrics ?? {},
    sort,
  );

  async function remove(id: string) {
    setDeleting(true);
    try {
      await draftRepository.remove(id);
      removeSessionMedia(id);
      setDrafts((previous) => previous.filter((draft) => draft.id !== id));
      setConfirmId(null);
      setMessage("Content deleted.");
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
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="content-sort" className="mb-1 block text-xs font-medium text-slate-600">Sort content</label>
          <select id="content-sort" value={sort} onChange={(event) => setParams((previous) => { previous.set("sort", event.target.value); return previous; }, { replace: true })} className="min-h-11 max-w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="newest">Newest first</option>
            <option value="revenue">Highest revenue</option>
            <option value="purchases">Most purchases</option>
            <option value="views">Most views</option>
          </select>
        </div>
        <div>
          <label htmlFor="content-analytics" className="mb-1 block text-xs font-medium text-slate-600">Demo analytics</label>
          <select id="content-analytics" value={analyticsMode} onChange={(event) => setParams((previous) => { previous.set("analytics", event.target.value); return previous; }, { replace: true })} className="min-h-11 max-w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="empty">No activity</option>
            <option value="sample">Sample activity</option>
            <option value="error">Simulate analytics error</option>
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        {analyticsMode === "sample"
          ? "Sample analytics: synthetic activity for published content only. Draft and scheduled content show zero. These fixtures are separate from dashboard sample purchases."
          : "Demo analytics only. No activity shows zero metrics; no live views or payments are tracked."}
        {" "}Revenue is gross USD from completed purchase amounts, including historical prices; pending and failed purchases are excluded.
      </p>
      {!loading && !error && !currentAnalytics && <p role="status" className="mt-4 text-sm text-slate-500">Loading performance…</p>}
      {!loading && !error && currentAnalytics?.error && (
        <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>{currentAnalytics.error} Metrics are unavailable; your content is still accessible.</p>
          <Button className="mt-3" onClick={() => setReload(value => value + 1)}>Retry analytics</Button>
        </div>
      )}
      <p className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
        Local demo: drafts are saved in this browser only. Files stay in memory
        until a reload; their details remain saved.
      </p>
      <div className="mt-5 flex flex-wrap gap-4">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <label htmlFor="content-search" className="sr-only">
            Search content
          </label>
          <input
            id="content-search"
            type="search"
            value={query}
            placeholder="Search content by title"
            onChange={(event) =>
              setParams(
                (previous) => {
                  previous.set("q", event.target.value);
                  return previous;
                },
                { replace: true },
              )
            }
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="content-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="content-status"
            value={
              ["DRAFT", "PUBLISHED", "SCHEDULED"].includes(status)
                ? status
                : "ALL"
            }
            onChange={(event) =>
              setParams(
                (previous) => {
                  previous.set("status", event.target.value);
                  return previous;
                },
                { replace: true },
              )
            }
            className="min-h-11 max-w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled for Publication</option>
          </select>
        </div>
      </div>
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
      {!loading &&
        !error &&
        drafts.length > 0 &&
        visibleContent.length === 0 && (
          <p className="mt-8 rounded-xl bg-white p-6 text-sm text-slate-600">
            No matching content
          </p>
        )}
      {!loading && !error && visibleContent.length > 0 && (
        <ContentPerformanceTable
          content={visibleContent}
          metrics={metrics}
          confirmId={confirmId}
          deleting={deleting}
          onConfirm={(id) => { setConfirmId(id); setMessage(""); }}
          onDelete={(id) => void remove(id)}
        />
      )}
    </>
  );
}
