import { draftRepository } from "../content/draftRepository";
import type { Purchase } from "./dashboardModel";

export type DashboardSnapshot = {
  purchases: Purchase[];
  contentCount: number;
  now: Date;
};
export type DemoMode = "sample" | "empty" | "error";

function samplePurchases(now: Date): Purchase[] {
  const titles = [
    "Lighting essentials",
    "Editing for beginners",
    "Build your creator brand",
    "Camera confidence",
  ];
  const countries = [
    "India",
    "United States",
    "United Kingdom",
    "Germany",
    "Canada",
    "Japan",
  ];
  const prices = [1299, 2499, 899, 1999];
  return Array.from({ length: 30 }, (_, index) => ({
    id: `demo-purchase-${index + 1}`,
    date: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - Math.floor(index * 1.5),
      12,
    ).toISOString(),
    content: titles[index % titles.length],
    amountCents: prices[index % prices.length],
    country: countries[index % countries.length],
    status:
      index % 11 === 10 ? "Failed" : index % 7 === 6 ? "Pending" : "Completed",
  }));
}

export const dashboardRepository = {
  async load(mode: DemoMode = "sample"): Promise<DashboardSnapshot> {
    if (mode === "error")
      throw new Error(
        "Demo dashboard request failed. Retry or return to the sample dashboard.",
      );
    const drafts = await draftRepository.list();
    const now = new Date();
    return {
      purchases: mode === "empty" ? [] : samplePurchases(now),
      contentCount: drafts.length,
      now,
    };
  },
};
