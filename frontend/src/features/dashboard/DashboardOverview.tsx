import { useEffect, useState } from "react";
import { Banknote, CalendarDays, ShoppingBag, Video } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { MetricCard } from "../../components/molecules/MetricCard";
import { formatPrice } from "../content/draftSchema";
import {
  dashboardRepository,
  type DashboardSnapshot,
} from "./dashboardRepository";
import { summarize } from "./dashboardModel";
import { RevenuePanel } from "./RevenuePanel";
import { RecentPurchases } from "./RecentPurchases";

export function DashboardOverview() {
  const [params] = useSearchParams();
  const mode =
    params.get("demo") === "empty"
      ? "empty"
      : params.get("demo") === "error"
        ? "error"
        : "sample";
  const [state, setState] = useState<{
    mode: string;
    data?: DashboardSnapshot;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    dashboardRepository
      .load(mode)
      .then((data) => {
        if (active) setState({ mode, data });
      })
      .catch((error) => {
        if (active) setState({ mode, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [mode, retry]);

  if (!state || state.mode !== mode)
    return (
      <div
        role="status"
        aria-label="Loading dashboard"
        className="mt-8 space-y-5"
      >
        <p className="text-sm text-slate-500">Loading dashboard...</p>
        <div
          aria-hidden="true"
          className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        >
          {[1, 2, 3, 4].map((key) => (
            <div
              key={key}
              className="h-36 rounded-2xl bg-slate-200 motion-safe:animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  if (!state.data)
    return (
      <div
        role="alert"
        className="mt-6 rounded-xl bg-red-50 p-5 text-sm text-red-800"
      >
        <h2 className="font-semibold">Unable to load dashboard</h2>
        <p className="mt-2 leading-6">{state.error}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Button
            onClick={() => {
              setState(undefined);
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </Button>
          {mode !== "sample" && (
            <Link
              to="/"
              className="inline-flex min-h-11 items-center font-semibold text-violet-700"
            >
              Return to sample dashboard
            </Link>
          )}
        </div>
      </div>
    );
  const { purchases, contentCount, now } = state.data;
  const metrics = summarize(purchases, contentCount, now);
  return (
    <>
      <p className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
        Sales figures use demo purchases. Total Content reflects your saved
        local content; sample sales are separate from that content.
      </p>
      <section aria-label="Overview metrics" className="mt-6">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatPrice(metrics.totalRevenueCents)}
            hint="Completed demo sales, all dates"
            icon={Banknote}
          />
          <MetricCard
            title="Revenue This Month"
            value={formatPrice(metrics.monthRevenueCents)}
            hint="Current calendar month"
            icon={CalendarDays}
          />
          <MetricCard
            title="Total Content"
            value={String(metrics.totalContent)}
            hint="Content saved in this browser"
            icon={Video}
          />
          <MetricCard
            title="Total Purchases"
            value={String(metrics.totalPurchases)}
            hint="Completed demo purchases"
            icon={ShoppingBag}
          />
        </dl>
      </section>
      <RevenuePanel purchases={purchases} now={now} />
      <RecentPurchases purchases={purchases} />
    </>
  );
}
