import { Link } from "react-router-dom";
import { Film, Trash2 } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { formatPrice, type Draft } from "./draftSchema";
import type { MetricsById } from "./contentPerformance";
import { getSessionMedia } from "./sessionMedia";
import { ThumbnailPreview } from "./ThumbnailPreview";
import { ContentStatus } from "./ContentStatus";

type Props = {
  content: Draft[];
  metrics?: MetricsById;
  confirmId: string | null;
  deleting: boolean;
  onConfirm: (id: string | null) => void;
  onDelete: (id: string) => void;
};

export function ContentPerformanceTable({ content, metrics, confirmId, deleting, onConfirm, onDelete }: Props) {
  const cell = "min-w-0 xl:align-top xl:px-3 xl:py-5";
  const label = "mb-1 block text-xs font-medium text-slate-500 xl:hidden";
  return (
    <div className="mt-6 min-w-0 xl:overflow-x-auto xl:rounded-2xl xl:border xl:border-slate-200 xl:bg-white">
      <table className="block w-full text-left text-sm xl:table xl:table-fixed">
        <caption className="sr-only">Content performance</caption>
        <thead className="hidden bg-slate-50 text-xs text-slate-500 xl:table-header-group">
          <tr>
            {["Content", "Price", "Views", "Purchases", "Revenue", "Status", "Actions"].map((heading, index) => (
              <th key={heading} scope="col" className={`px-3 py-4 font-semibold ${index === 0 ? "w-[27%]" : index === 6 ? "w-[23%]" : "w-[10%]"}`}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody className="grid gap-5 md:grid-cols-2 xl:table-row-group">
          {content.map(item => {
            const thumbnail = getSessionMedia(item.id).thumbnail;
            const performance = metrics?.[item.id];
            return (
              <tr key={item.id} className="grid min-w-0 grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4 xl:table-row xl:border-x-0 xl:border-t-0 xl:p-0">
                <td className={`${cell} col-span-2 sm:col-span-4`}>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {thumbnail ? <ThumbnailPreview file={thumbnail} className="h-full w-full object-cover" /> : <Film aria-hidden="true" size={24} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-slate-900">{item.title}</h2>
                      <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">{item.description}</p>
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {item.thumbnail && !thumbnail ? "Reselect thumbnail to preview" : !item.thumbnail ? "No thumbnail selected" : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={cell}><span className={label}>Price</span><span className="break-words font-semibold tabular-nums">{formatPrice(item.priceCents)}</span></td>
                <td className={cell}><span className={label}>Views</span><span className="tabular-nums">{performance ? performance.views.toLocaleString("en-US") : "?"}</span></td>
                <td className={cell}><span className={label}>Purchases</span><span className="tabular-nums">{performance ? performance.purchases.toLocaleString("en-US") : "?"}</span></td>
                <td className={cell}><span className={label}>Revenue</span><span className="break-words font-semibold tabular-nums">{performance ? formatPrice(performance.revenueCents) : "?"}</span></td>
                <td className={`${cell} col-span-2 sm:col-span-4`}><span className={label}>Status</span><ContentStatus status={item.status} /></td>
                <td className={`${cell} col-span-2 sm:col-span-4`}>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/content/${item.id}`} aria-label={`View ${item.title}`} className="inline-flex min-h-11 items-center rounded-xl bg-violet-50 px-3 font-semibold text-violet-700">View</Link>
                    <Link to={`/content/${item.id}/edit`} aria-label={`Edit ${item.title}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 font-semibold text-slate-700">{item.status === "DRAFT" ? "Edit draft" : "Edit content"}</Link>
                    <Button aria-label={`Delete ${item.title}`} disabled={deleting} onClick={() => onConfirm(item.id)} variant="danger"><Trash2 size={16} aria-hidden="true" />Delete</Button>
                  </div>
                  {confirmId === item.id && (
                    <section role="group" aria-label={`Confirm deletion of ${item.title}`} className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                      <p className="text-sm leading-6 text-red-900">Delete this content? This action cannot be undone and cancels any scheduled publication.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button disabled={deleting} onClick={() => onConfirm(null)}>{item.status === "DRAFT" ? "Keep draft" : "Keep content"}</Button>
                        <Button disabled={deleting} onClick={() => onDelete(item.id)} variant="danger">{deleting ? "Deleting…" : "Confirm delete"}</Button>
                      </div>
                    </section>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
