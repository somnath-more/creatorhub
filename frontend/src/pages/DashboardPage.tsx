import { Link } from "react-router-dom";
import { DashboardOverview } from "../features/dashboard/DashboardOverview";

export function DashboardPage() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
            Your workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            A clearer picture of your creative business.
          </p>
        </div>
        <Link
          to="/content/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Create content
        </Link>
      </div>
      <DashboardOverview />
    </>
  );
}
