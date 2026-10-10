import "../../test/useDemoRepositories";
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthenticatedPortal as App } from "../../test/AuthenticatedPortal";
import { draftRepository } from "./draftRepository";
import { contentAnalyticsRepository } from "./contentAnalyticsRepository";

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function open(path = "/content") {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}
async function seed() {
  const a = await draftRepository.save({ title: "First tutorial", description: "Sample content", price: "99.99" });
  const b = await draftRepository.save({ title: "Second tutorial", description: "Sample content", price: "2.00" });
  const records = [{ ...a, createdAt: "2026-01-01T00:00:00.000Z" }, { ...b, createdAt: "2026-02-01T00:00:00.000Z" }];
  localStorage.setItem("creatorhub.drafts.v1", JSON.stringify(records));
  return { a, b };
}

it("shows zero metrics for new content and retains view/edit/delete actions", async () => {
  await seed();
  open();
  const table = await screen.findByRole("table", { name: "Content performance" });
  const row = within(table).getByRole("heading", { name: "First tutorial" }).closest("tr")!;
  expect(within(row).getByText("$99.99")).toBeVisible();
  expect(await within(row).findByText("$0.00")).toBeVisible();
  expect(within(row).getAllByText("0")).toHaveLength(2);
  expect(within(row).getByRole("link", { name: "View First tutorial" })).toHaveAttribute("href", expect.stringContaining("/content/"));
  expect(within(row).getByRole("link", { name: "Edit First tutorial" })).toBeVisible();
  expect(within(row).getByRole("button", { name: "Delete First tutorial" })).toBeVisible();
});

it("sorts actual metrics and combines URL sorting with search and status filtering", async () => {
  const user = userEvent.setup();
  const { a, b } = await seed();
  vi.spyOn(contentAnalyticsRepository, "load").mockResolvedValue({
    [a.id]: { views: 100, purchases: 2, revenueCents: 2198 },
    [b.id]: { views: 5, purchases: 10, revenueCents: 500 },
  });
  open("/content?sort=revenue&q=tutorial&status=DRAFT");
  await screen.findByText("$21.98");
  expect(screen.getAllByRole("heading", { level: 2 }).map(item => item.textContent)).toEqual(["First tutorial", "Second tutorial"]);
  await user.selectOptions(screen.getByLabelText("Sort content"), "purchases");
  expect(screen.getAllByRole("heading", { level: 2 }).map(item => item.textContent)).toEqual(["Second tutorial", "First tutorial"]);
  expect(screen.getByRole("searchbox")).toHaveValue("tutorial");
  expect(screen.getByLabelText("Filter by status")).toHaveValue("DRAFT");
  await user.selectOptions(screen.getByLabelText("Filter by status"), "PUBLISHED");
  expect(screen.getByText("No matching content")).toBeVisible();
});

it("reports analytics failures without hiding content or showing false zero metrics, and recovers", async () => {
  const user = userEvent.setup();
  await seed();
  open("/content?analytics=error");
  expect(await screen.findByRole("alert")).toHaveTextContent("Metrics are unavailable");
  expect(screen.getByRole("link", { name: "View First tutorial" })).toBeVisible();
  expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Retry analytics" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Demo analytics request failed");
  await user.selectOptions(screen.getByLabelText("Demo analytics"), "empty");
  expect((await screen.findAllByText("$0.00")).length).toBe(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
