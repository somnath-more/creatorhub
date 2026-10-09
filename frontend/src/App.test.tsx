// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

afterEach(cleanup);

function renderPage(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("creator portal navigation", () => {
  it.each([
    ["/", "Dashboard"],
    ["/content", "Content"],
    ["/content/new", "Create content"],
    ["/verification", "Verification"],
  ])("opens %s directly", (path, title) => {
    renderPage(path);
    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("navigates between pages and marks only the current destination active", async () => {
    const user = userEvent.setup();
    renderPage();
    const navigation = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    await user.click(
      within(navigation).getByRole("link", { name: "Create content" }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Create content" }),
    ).toBeVisible();
    expect(
      within(navigation).getByRole("link", { name: "Create content" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByRole("link", { name: "Content" }),
    ).not.toHaveAttribute("aria-current");
    await user.click(
      within(navigation).getByRole("link", { name: "Verification" }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Verification" }),
    ).toBeVisible();
  });

  it("toggles the mobile navigation and closes it on navigation", async () => {
    const user = userEvent.setup();
    renderPage();
    const toggle = screen.getByRole("button", { name: "Open navigation" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(
      screen.getByRole("button", { name: "Close navigation" }),
    ).toHaveAttribute("aria-expanded", "true");
    const navigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    await user.click(within(navigation).getByRole("link", { name: "Content" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Content" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
  });

  it("offers a working recovery link for unknown routes", async () => {
    const user = userEvent.setup();
    renderPage("/missing");
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Back to dashboard" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();
  });
});
