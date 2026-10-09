// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";
import { draftRepository } from "./draftRepository";
import { verificationRepository } from "../verification/verificationRepository";

beforeEach(() => localStorage.clear());
afterEach(cleanup);
function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("publication experience", () => {
  it("blocks an unverified publishing attempt and allows keeping the draft", async () => {
    const user = userEvent.setup();
    const content = await draftRepository.save({
      title: "My video",
      description: "Sample content",
      price: "1.00",
    });
    open(`/content/${content.id}`);
    await user.click(
      await screen.findByRole("button", { name: "Publish now" }),
    );
    expect(
      await screen.findByRole("link", { name: "Start verification" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Keep as draft" }));
    expect(
      screen.queryByRole("link", { name: "Start verification" }),
    ).not.toBeInTheDocument();
    expect((await draftRepository.get(content.id))?.status).toBe("DRAFT");
  });
  it("offers clearly labelled simulated approval only after submission", async () => {
    const user = userEvent.setup();
    await verificationRepository.save({
      status: "SUBMITTED",
      step: 4,
      personal: {
        fullName: "Sample Creator",
        dateOfBirth: "1990-01-01",
        country: "India",
      },
      documentType: "PASSPORT",
      submittedAt: new Date().toISOString(),
    });
    open("/verification");
    await user.click(
      await screen.findByRole("button", { name: "Simulate approval (demo)" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Verified for demo publishing",
      }),
    ).toBeVisible();
  });
  it("searches and filters content with a useful no-results state", async () => {
    const user = userEvent.setup();
    await draftRepository.save({
      title: "First tutorial",
      description: "Sample content",
      price: "1.00",
    });
    await draftRepository.save({
      title: "Second tutorial",
      description: "Sample content",
      price: "2.00",
    });
    open("/content");
    await user.type(
      await screen.findByRole("searchbox", { name: "Search content" }),
      "First",
    );
    expect(
      screen.getByRole("heading", { name: "First tutorial" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Second tutorial" }),
    ).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText("Filter by status"),
      "PUBLISHED",
    );
    expect(screen.getByText("No matching content")).toBeVisible();
  });
});
