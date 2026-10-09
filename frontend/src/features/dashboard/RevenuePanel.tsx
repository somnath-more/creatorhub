import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { formatPrice } from "../content/draftSchema";
import { revenueSeries, type Purchase } from "./dashboardModel";

const RevenueChart = lazy(() => import("./RevenueChart"));

export function RevenuePanel({
  purchases,
  now,
}: {
  purchases: Purchase[];
  now: Date;
}) {
  const [params, setParams] = useSearchParams();
  const days = params.get("range") === "7" ? 7 : 30;
  const series = revenueSeries(purchases, days, now);
  const total = series.reduce((sum, item) => sum + item.revenueCents, 0);

  return (
    <section
      aria-labelledby="revenue-heading"
      className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="revenue-heading" className="text-lg font-semibold">
            Revenue over time
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatPrice(total)} in the last {days} days
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Revenue time range">
          {([7, 30] as const).map((range) => (
            <Button
              key={range}
              variant={days === range ? "primary" : "secondary"}
              aria-pressed={days === range}
              onClick={() =>
                setParams(
                  (previous) => {
                    previous.set("range", String(range));
                    return previous;
                  },
                  { replace: true },
                )
              }
            >
              Last {range} days
            </Button>
          ))}
        </div>
      </div>
      {total === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
          No completed revenue in this period.
        </p>
      ) : (
        <Suspense
          fallback={
            <p
              role="status"
              className="flex h-64 items-center text-sm text-slate-500"
            >
              Loading chart...
            </p>
          }
        >
          <RevenueChart data={series} />
        </Suspense>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        USD · Completed purchases only · Dates use your device timezone.
      </p>
      <details className="mt-4 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-violet-700">
          View revenue data
        </summary>
        <div className="max-h-72 overflow-auto">
          <table
            aria-label="Daily revenue data"
            className="w-full text-left text-sm"
          >
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-3">
                  Date
                </th>
                <th scope="col" className="py-3 text-right">
                  Revenue (USD)
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr key={item.day} className="border-b border-slate-100">
                  <td className="py-2">{item.day}</td>
                  <td className="py-2 text-right">
                    {formatPrice(item.revenueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
