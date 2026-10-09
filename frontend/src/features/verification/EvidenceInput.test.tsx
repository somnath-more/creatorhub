// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { EvidenceInput } from "./EvidenceInput";

afterEach(cleanup);
describe("sample identity evidence", () => {
  it("rejects empty and oversized documents and accepts a valid PDF", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<EvidenceInput kind="document" onSelect={select} />);
    await user.upload(
      screen.getByLabelText("Sample identity document"),
      new File([], "empty.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("nonempty");
    const large = new File(["sample"], "large.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(large, "size", { value: 11 * 1024 ** 2 });
    await user.upload(screen.getByLabelText("Sample identity document"), large);
    expect(screen.getByRole("alert")).toHaveTextContent("10 MB");
    expect(select).toHaveBeenLastCalledWith(undefined);
    const valid = new File(["sample"], "sample.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Sample identity document"), valid);
    expect(select).toHaveBeenLastCalledWith(valid);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("rejects a PDF as a selfie", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const select = vi.fn();
    render(<EvidenceInput kind="selfie" onSelect={select} />);
    await user.upload(
      screen.getByLabelText("Sample selfie"),
      new File(["sample"], "bad.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "supported file format",
    );
    expect(select).toHaveBeenLastCalledWith(undefined);
  });
});
