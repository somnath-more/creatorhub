// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function open() {
  return render(
    <MemoryRouter initialEntries={["/verification"]}>
      <App />
    </MemoryRouter>,
  );
}
async function personalStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: "Start verification" }),
  );
  await user.type(screen.getByLabelText("Full name"), "Sample Creator");
  await user.type(screen.getByLabelText("Date of birth"), "1995-04-18");
  await user.type(screen.getByLabelText("Country"), "India");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("verification workflow", () => {
  it("validates each step, supports back navigation, and submits without marking verified", async () => {
    const user = userEvent.setup();
    const view = open();
    await user.click(
      await screen.findByRole("button", { name: "Start verification" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Enter your full name.")).toBeVisible();
    await user.type(screen.getByLabelText("Full name"), "Sample Creator");
    await user.type(screen.getByLabelText("Date of birth"), "1995-04-18");
    await user.type(screen.getByLabelText("Country"), "India");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", { name: "Identity document" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByText("Select an identification type."),
    ).toBeVisible();
    await user.selectOptions(
      screen.getByLabelText("Identification type"),
      "PASSPORT",
    );
    await user.upload(
      screen.getByLabelText("Sample identity document"),
      new File(["sample"], "sample.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByLabelText("Full name")).toHaveValue(
      "Sample Creator",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Identification type")).toHaveValue(
      "PASSPORT",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", { name: "Identity check" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Submit verification" }),
    );
    expect(
      await screen.findByText("Choose a sample selfie to continue."),
    ).toBeVisible();
    await user.upload(
      screen.getByLabelText("Sample selfie"),
      new File(["sample"], "selfie.jpg", { type: "image/jpeg" }),
    );
    const storage = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Full");
      });
    await user.click(
      screen.getByRole("button", { name: "Submit verification" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be saved",
    );
    expect(
      screen.getByRole("heading", { name: "Identity check" }),
    ).toBeVisible();
    expect(
      JSON.parse(localStorage.getItem("creatorhub.verification.v1")!).status,
    ).toBe("IN_PROGRESS");
    storage.mockRestore();
    await user.click(
      screen.getByRole("button", { name: "Submit verification" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Verification submitted" }),
    ).toBeVisible();
    expect(screen.getByText(/Publishing remains locked/)).toBeVisible();
    const saved = JSON.parse(
      localStorage.getItem("creatorhub.verification.v1")!,
    );
    expect(saved.status).toBe("SUBMITTED");
    expect(saved.step).toBe(4);
    expect(saved.document).toBeUndefined();
    expect(saved.selfie).toBeUndefined();
    view.unmount();
    open();
    expect(
      await screen.findByRole("heading", { name: "Verification submitted" }),
    ).toBeVisible();
  });

  it("resumes saved personal details and requires files to be reselected after reload", async () => {
    const user = userEvent.setup();
    const view = open();
    await personalStep(user);
    await user.selectOptions(
      screen.getByLabelText("Identification type"),
      "NATIONAL_ID",
    );
    await user.upload(
      screen.getByLabelText("Sample identity document"),
      new File(["sample"], "id.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    view.unmount();
    open();
    expect(
      await screen.findByRole("heading", { name: "Identity document" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Identification type")).toHaveValue(
      "NATIONAL_ID",
    );
    expect(screen.getByText(/Reselect sample files/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByText("Choose a sample identity document to continue."),
    ).toBeVisible();
  });

  it("keeps the current step and entered details when progress cannot be saved", async () => {
    const user = userEvent.setup();
    open();
    await user.click(
      await screen.findByRole("button", { name: "Start verification" }),
    );
    await user.type(screen.getByLabelText("Full name"), "Sample Creator");
    await user.type(screen.getByLabelText("Date of birth"), "1995-04-18");
    await user.type(screen.getByLabelText("Country"), "India");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Full");
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be saved",
    );
    expect(screen.getByLabelText("Full name")).toHaveValue("Sample Creator");
  });

  it("offers retry when stored progress is corrupted", async () => {
    localStorage.setItem("creatorhub.verification.v1", "broken");
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be read",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
