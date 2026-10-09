export type Purchase = {
  id: string;
  date: string;
  content: string;
  amountCents: number;
  country: string;
  status: "Completed" | "Pending" | "Failed";
};

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function summarize(
  purchases: Purchase[],
  contentCount: number,
  now = new Date(),
) {
  const completed = purchases.filter(
    (purchase) => purchase.status === "Completed",
  );
  return {
    totalRevenueCents: completed.reduce(
      (sum, purchase) => sum + purchase.amountCents,
      0,
    ),
    monthRevenueCents: completed
      .filter((purchase) => {
        const date = new Date(purchase.date);
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, purchase) => sum + purchase.amountCents, 0),
    totalContent: contentCount,
    totalPurchases: completed.length,
  };
}

export function revenueSeries(
  purchases: Purchase[],
  days: 7 | 30,
  now = new Date(),
) {
  const totals = new Map<string, number>();
  for (const purchase of purchases) {
    if (purchase.status !== "Completed") continue;
    const key = localDay(new Date(purchase.date));
    totals.set(key, (totals.get(key) ?? 0) + purchase.amountCents);
  }
  return Array.from({ length: days }, (_, index) => {
    // Calendar arithmetic remains correct across daylight-saving changes.
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - days + index + 1,
      12,
    );
    const day = localDay(date);
    const revenueCents = totals.get(day) ?? 0;
    return {
      day,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenueCents,
      revenue: revenueCents / 100,
    };
  });
}
