import { describe, expect, it } from "vitest";
import { summarize, revenueSeries, type Purchase } from "./dashboardModel";

const now = new Date(2026, 9, 9, 12);
function purchase(
  id: string,
  day: Date,
  amountCents: number,
  status: Purchase["status"] = "Completed",
): Purchase {
  return {
    id,
    date: day.toISOString(),
    content: "Tutorial",
    amountCents,
    country: "India",
    status,
  };
}
const purchases = [
  purchase("today", now, 1299),
  purchase("month", new Date(2026, 9, 1, 12), 501),
  purchase("previous", new Date(2026, 8, 30, 12), 200),
  purchase("pending", now, 9000, "Pending"),
  purchase("failed", now, 9000, "Failed"),
];

describe("dashboard metrics", () => {
  it("uses completed purchases only and the current local calendar month", () => {
    expect(summarize(purchases, 3, now)).toEqual({
      totalRevenueCents: 2000,
      monthRevenueCents: 1800,
      totalContent: 3,
      totalPurchases: 3,
    });
  });
  it("zero-fills calendar days and excludes purchases outside the selected range", () => {
    const series = revenueSeries(purchases, 7, now);
    expect(series).toHaveLength(7);
    expect(series[0]).toMatchObject({ day: "2026-10-03", revenueCents: 0 });
    expect(series[6]).toMatchObject({ day: "2026-10-09", revenueCents: 1299 });
    expect(series.reduce((sum, item) => sum + item.revenueCents, 0)).toBe(1299);
  });
  it("handles an empty dataset and a month boundary", () => {
    expect(summarize([], 0, now).totalPurchases).toBe(0);
    const series = revenueSeries([], 7, new Date(2026, 0, 2, 12));
    expect(series[0].day).toBe("2025-12-27");
    expect(series.every((item) => item.revenueCents === 0)).toBe(true);
  });
});
