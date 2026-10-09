// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";
import { draftRepository } from "../content/draftRepository";
import { dashboardRepository } from "./dashboardRepository";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function open(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("dashboard overview", () => {
  it("shows a loading state while the repository is pending", () => {
    vi.spyOn(dashboardRepository, "load").mockReturnValue(
      new Promise(() => {}),
    );
    open();
    expect(
      screen.getByRole("status", { name: "Loading dashboard" }),
    ).toBeVisible();
  });

  it("restores search and chart range from the URL", async () => {
    open("/?q=Japan&range=7");
    expect(
      await screen.findByRole("searchbox", { name: "Search purchases" }),
    ).toHaveValue("Japan");
    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Page 1 of 1")).toBeVisible();
  });

  it("recovers from the simulated error using the sample link", async () => {
    const user = userEvent.setup();
    open("/?demo=error");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "request failed",
    );
    await user.click(
      screen.getByRole("link", { name: "Return to sample dashboard" }),
    );
    expect(
      await screen.findByRole("region", { name: "Overview metrics" }),
    ).toBeVisible();
  });
  it("shows demo sales metrics and the actual saved draft count", async () => {
    await draftRepository.save({
      title: "My draft",
      description: "A sample draft",
      price: "5.00",
    });
    open();
    const metrics = await screen.findByRole("region", {
      name: "Overview metrics",
    });
    expect(within(metrics).getByText("Total Revenue")).toBeVisible();
    expect(within(metrics).getByText("Revenue This Month")).toBeVisible();
    expect(within(metrics).getByText("Total Purchases")).toBeVisible();
    expect(within(metrics).getByText("1")).toBeVisible();
    expect(screen.getByText(/Sales figures use demo purchases/)).toBeVisible();
  });

  it("paginates and resets the page when searching", async () => {
    const user = userEvent.setup();
    open();
    await user.click(
      await screen.findByRole("button", { name: "Next purchases page" }),
    );
    expect(screen.getByText("Page 2 of 6")).toBeVisible();
    await user.type(
      screen.getByRole("searchbox", { name: "Search purchases" }),
      "no-such-video",
    );
    expect(screen.getByText("No matching purchases")).toBeVisible();
    await user.clear(
      screen.getByRole("searchbox", { name: "Search purchases" }),
    );
    expect(screen.getByText("Page 1 of 6")).toBeVisible();
  });

  it("changes the chart range and provides an accessible data table", async () => {
    const user = userEvent.setup();
    open();
    await user.click(
      await screen.findByRole("button", { name: "Last 7 days" }),
    );
    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByText("View revenue data"));
    expect(
      screen.getByRole("table", { name: "Daily revenue data" }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("table", { name: "Daily revenue data" }),
      ).getAllByRole("row"),
    ).toHaveLength(8);
  });

  it("shows the no-purchases state", async () => {
    open("/?demo=empty");
    expect(await screen.findByText("No purchases yet")).toBeVisible();
  });

  it("recovers from a storage error after retry", async () => {
    const user = userEvent.setup();
    localStorage.setItem("creatorhub.drafts.v1", "broken");
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be read",
    );
    localStorage.clear();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("region", { name: "Overview metrics" }),
    ).toBeVisible();
  });

  it("clamps out-of-range pagination links", async () => {
    open("/?page=999");
    expect(await screen.findByText("Page 6 of 6")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Next purchases page" }),
    ).toBeDisabled();
  });
});
