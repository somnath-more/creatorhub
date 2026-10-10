// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthenticatedPortal as App } from "../../test/AuthenticatedPortal";
import { uploadService } from "./uploadService";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function open(path = "/content/new") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

async function fillDraft(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Title"), "My first tutorial");
  await user.type(
    screen.getByLabelText("Description"),
    "Learn something useful today.",
  );
  await user.clear(screen.getByLabelText("Price (USD)"));
  await user.type(screen.getByLabelText("Price (USD)"), "9.99");
}

describe("content draft workflow", () => {
  it("starts uploads on selection, cancels a replaced file, and saves while uploading", async () => {
    const user = userEvent.setup();
    open();
    await fillDraft(user);
    vi.useFakeTimers();
    const first = new File(["first"], "first.mp4", { type: "video/mp4" });
    const replacement = new File(["second"], "second.mp4", { type: "video/mp4" });
    fireEvent.change(screen.getByLabelText("Video"), { target: { files: [first] } });
    expect(uploadService.get(first).status).toBe("UPLOADING");
    fireEvent.change(screen.getByLabelText("Video"), { target: { files: [replacement] } });
    expect(uploadService.get(first).status).toBe("CANCELLED");
    expect(uploadService.get(replacement).status).toBe("UPLOADING");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Save draft" })); });
    expect(screen.getByText("Draft saved.")).toBeVisible();
    expect(uploadService.get(replacement).status).toBe("UPLOADING");
    act(() => vi.advanceTimersByTime(5000));
    expect(uploadService.get(replacement).status).toBe("COMPLETED");
  });
  it("validates, saves, persists across remounts, edits, cancels deletion, then deletes", async () => {
    const user = userEvent.setup();
    const view = open();
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByText("Enter a title.")).toBeVisible();
    await fillDraft(user);
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Draft saved");
    expect(
      await screen.findByRole("heading", { name: "My first tutorial" }),
    ).toBeVisible();
    expect(screen.getByText("$9.99")).toBeVisible();
    view.unmount();
    open("/content");
    await user.click(
      await screen.findByRole("link", { name: "Edit My first tutorial" }),
    );
    const title = await screen.findByLabelText("Title");
    expect(title).toHaveValue("My first tutorial");
    await user.clear(title);
    await user.type(title, "Updated tutorial");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await user.click(
      await screen.findByRole("button", { name: "Delete Updated tutorial" }),
    );
    await user.click(screen.getByRole("button", { name: "Keep draft" }));
    expect(
      screen.getByRole("heading", { name: "Updated tutorial" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Delete Updated tutorial" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(await screen.findByText("No drafts yet")).toBeVisible();
  });

  it("retains entered values and reports a failed save", async () => {
    const user = userEvent.setup();
    open();
    await fillDraft(user);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be saved",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("My first tutorial");
  });

  it("shows a recoverable error for corrupted storage", async () => {
    localStorage.setItem("creatorhub.drafts.v1", "invalid");
    open("/content");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be read",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("handles a missing edit target", async () => {
    open("/content/missing/edit");
    expect(
      await screen.findByRole("heading", { name: "Draft not found" }),
    ).toBeVisible();
  });
});
