import type { Draft } from "./draftSchema";

const statusLabels = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  SCHEDULED: "Scheduled for Publication",
};
const colors = {
  DRAFT: "bg-amber-50 text-amber-800",
  PUBLISHED: "bg-emerald-50 text-emerald-800",
  SCHEDULED: "bg-violet-50 text-violet-800",
};

export function ContentStatus({ status }: { status: Draft["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
