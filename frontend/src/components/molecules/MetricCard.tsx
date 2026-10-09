import type { LucideIcon } from "lucide-react";

type Props = { title: string; value: string; hint: string; icon: LucideIcon };
export function MetricCard({ title, value, hint, icon: Icon }: Props) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <dt className="text-sm font-medium text-slate-500">{title}</dt>
        <Icon
          size={20}
          className="shrink-0 text-violet-600"
          aria-hidden="true"
        />
      </div>
      <dd className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </dd>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}
