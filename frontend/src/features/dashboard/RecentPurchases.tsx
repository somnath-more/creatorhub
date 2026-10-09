import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { formatPrice } from "../content/draftSchema";
import type { Purchase } from "./dashboardModel";

const pageSize = 5;
const statusColors = {
  Completed: "bg-emerald-50 text-emerald-800",
  Pending: "bg-amber-50 text-amber-800",
  Failed: "bg-red-50 text-red-800",
};
function Status({ status }: { status: Purchase["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[status]}`}
    >
      {status}
    </span>
  );
}
function dateLabel(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentPurchases({ purchases }: { purchases: Purchase[] }) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const normalized = query.trim().toLowerCase();
  const filtered = purchases
    .filter((item) =>
      `${item.content} ${item.country} ${item.status}`
        .toLowerCase()
        .includes(normalized),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requested = Number(params.get("page") ?? 1);
  const page = Math.min(
    totalPages,
    Math.max(1, Number.isSafeInteger(requested) ? requested : 1),
  );
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  function changePage(next: number) {
    setParams((previous) => {
      previous.set("page", String(next));
      return previous;
    });
  }

  return (
    <section
      aria-labelledby="purchases-heading"
      className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="purchases-heading" className="text-lg font-semibold">
            Recent purchases
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sample transactions from your audience.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search purchases"
            value={query}
            onChange={(event) =>
              setParams(
                (previous) => {
                  previous.set("q", event.target.value);
                  previous.delete("page");
                  return previous;
                },
                { replace: true },
              )
            }
            placeholder="Search content, country, status"
            className="min-h-11 w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center">
          <h3 className="font-semibold">
            {purchases.length ? "No matching purchases" : "No purchases yet"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {purchases.length
              ? "Try another title, country, or status."
              : "New purchases will appear here when your audience buys access."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table
              aria-label="Recent purchase records"
              className="w-full text-left text-sm"
            >
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Date", "Content", "Amount", "Country", "Status"].map(
                    (label) => (
                      <th key={label} scope="col" className="px-3 py-3">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="whitespace-nowrap px-3 py-4 text-slate-500">
                      <time dateTime={item.date}>{dateLabel(item.date)}</time>
                    </td>
                    <td className="px-3 py-4 font-medium">{item.content}</td>
                    <td className="whitespace-nowrap px-3 py-4">
                      {formatPrice(item.amountCents)}
                    </td>
                    <td className="px-3 py-4 text-slate-500">{item.country}</td>
                    <td className="px-3 py-4">
                      <Status status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul aria-label="Purchase cards" className="mt-5 space-y-3 md:hidden">
            {visible.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words text-sm font-semibold">
                    {item.content}
                  </h3>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatPrice(item.amountCents)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  <time dateTime={item.date}>{dateLabel(item.date)}</time> ·{" "}
                  {item.country}
                </p>
                <div className="mt-3">
                  <Status status={item.status} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                aria-label="Previous purchases page"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                Previous
              </Button>
              <Button
                aria-label="Next purchases page"
                disabled={page === totalPages}
                onClick={() => changePage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
