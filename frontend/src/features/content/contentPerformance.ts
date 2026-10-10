import type { Draft } from "./draftSchema";

export type ContentMetrics = { views: number; purchases: number; revenueCents: number };
export type MetricsById = Record<string, ContentMetrics>;
export type ContentPurchase = {
  contentId: string;
  amountCents: number;
  status: "Completed" | "Pending" | "Failed";
};

export function summarizeContent(
  ids: string[],
  views: Record<string, number>,
  purchases: ContentPurchase[],
): MetricsById {
  const totals = new Map(ids.map(id => [id, {
    views: views[id] ?? 0, purchases: 0, revenueCents: 0,
  }]));
  for (const purchase of purchases) {
    const metrics = totals.get(purchase.contentId);
    if (!metrics || purchase.status !== "Completed") continue;
    metrics.purchases += 1;
    metrics.revenueCents += purchase.amountCents;
  }
  return Object.fromEntries(totals);
}

export function sortContent(items: Draft[], metrics: MetricsById, sort: string): Draft[] {
  return [...items].sort((a, b) => {
    let difference: number;
    if (sort === "views" || sort === "purchases" || sort === "revenue") {
      const key = sort === "revenue" ? "revenueCents" : sort;
      difference = (metrics[b.id]?.[key] ?? 0) - (metrics[a.id]?.[key] ?? 0);
    } else {
      difference = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    return difference || a.id.localeCompare(b.id);
  });
}
