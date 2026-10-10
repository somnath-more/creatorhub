import type { Draft } from "./draftSchema";
import { summarizeContent, type ContentPurchase, type MetricsById } from "./contentPerformance";

export type AnalyticsMode = "empty" | "sample" | "error";
export interface ContentAnalyticsRepository {
  load(content: Draft[], mode?: AnalyticsMode): Promise<MetricsById>;
}

// Synthetic fixtures only: keyed by stable IDs, independent of titles/current prices.
export const contentAnalyticsRepository: ContentAnalyticsRepository = {
  async load(content, mode = "empty") {
    if (mode === "error") throw new Error("Demo analytics request failed. Retry or choose another analytics mode.");
    const views: Record<string, number> = {};
    const purchases: ContentPurchase[] = [];
    if (mode === "sample") {
      for (const item of content.filter(item => item.status === "PUBLISHED")) {
        const seed = [...item.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
        views[item.id] = (seed % 200 + 1) * 10;
        for (let index = 0; index < seed % 4 + 1; index++) {
          purchases.push({ contentId: item.id, amountCents: [1299, 899, 0, 1999][index], status: "Completed" });
        }
        purchases.push({ contentId: item.id, amountCents: 4999, status: "Pending" });
        purchases.push({ contentId: item.id, amountCents: 4999, status: "Failed" });
      }
    }
    return summarizeContent(content.map(item => item.id), views, purchases);
  },
};
