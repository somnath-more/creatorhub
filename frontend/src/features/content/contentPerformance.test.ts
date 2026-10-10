import { describe, expect, it } from "vitest";
import { summarizeContent, sortContent } from "./contentPerformance";
import { contentAnalyticsRepository } from "./contentAnalyticsRepository";
import type { Draft } from "./draftSchema";

const draft = (id: string, createdAt = "2026-01-01T00:00:00.000Z"): Draft => ({
  id, title: id, description: "Sample content", priceCents: 9999,
  currency: "USD", status: "DRAFT", mediaStatus: "NOT_READY", createdAt, updatedAt: createdAt,
});

describe("content performance", () => {
  it("sums completed transaction amounts by content ID, including free purchases", () => {
    const metrics = summarizeContent(["a", "b", "new"], { a: 100, b: 20 }, [
      { contentId: "a", amountCents: 1299, status: "Completed" },
      { contentId: "a", amountCents: 899, status: "Completed" },
      { contentId: "a", amountCents: 5000, status: "Pending" },
      { contentId: "a", amountCents: 7000, status: "Failed" },
      { contentId: "b", amountCents: 0, status: "Completed" },
      { contentId: "deleted", amountCents: 1000, status: "Completed" },
    ]);
    expect(metrics.a).toEqual({ views: 100, purchases: 2, revenueCents: 2198 });
    expect(metrics.b).toEqual({ views: 20, purchases: 1, revenueCents: 0 });
    expect(metrics.new).toEqual({ views: 0, purchases: 0, revenueCents: 0 });
    expect(metrics.deleted).toBeUndefined();
  });

  it("sorts numeric metrics and creation date without changing input, with stable ID ties", () => {
    const items = [draft("b"), draft("a"), draft("c", "2026-02-01T00:00:00.000Z")];
    const metrics = { a: { views: 30, purchases: 1, revenueCents: 1000 }, b: { views: 2, purchases: 10, revenueCents: 200 }, c: { views: 2, purchases: 1, revenueCents: 1000 } };
    const ids = (sort: string) => sortContent(items, metrics, sort).map(item => item.id);
    expect(ids("views")).toEqual(["a", "b", "c"]);
    expect(ids("purchases")).toEqual(["b", "a", "c"]);
    expect(ids("revenue")).toEqual(["a", "c", "b"]);
    expect(ids("newest")).toEqual(["c", "a", "b"]);
    expect(ids("invalid")).toEqual(ids("newest"));
    expect(items.map(item => item.id)).toEqual(["b", "a", "c"]);
  });

  it("returns zero activity by default and deterministic synthetic metrics only for published content", async () => {
    const items = [draft("new"), { ...draft("published"), status: "PUBLISHED" as const }];
    const empty = await contentAnalyticsRepository.load(items);
    expect(empty.published.revenueCents).toBe(0);
    const sample = await contentAnalyticsRepository.load(items, "sample");
    expect(sample.new).toEqual(empty.new);
    expect(sample.published.views).toBeGreaterThan(0);
    expect(sample.published.purchases).toBeGreaterThan(0);
    expect(await contentAnalyticsRepository.load(items.map(item => ({ ...item, priceCents: 1 })), "sample")).toEqual(sample);
    await expect(contentAnalyticsRepository.load(items, "error")).rejects.toThrow("analytics");
  });
});
