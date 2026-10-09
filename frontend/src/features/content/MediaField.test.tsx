// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MediaField } from "./MediaField";

beforeEach(() => {
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:thumbnail-preview");
      static revokeObjectURL = vi.fn();
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("draft media selection", () => {
  it("rejects unsupported, empty, and oversized thumbnails without selecting them", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(
      <MediaField
        kind="thumbnail"
        onChange={onChange}
        onValidityChange={onValidityChange}
      />,
    );
    await user.upload(
      screen.getByLabelText("Thumbnail"),
      new File(["text"], "bad.txt", { type: "text/plain" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "supported thumbnail format",
    );
    await user.upload(
      screen.getByLabelText("Thumbnail"),
      new File([], "empty.png", { type: "image/png" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("empty");
    const oversized = new File(["x"], "large.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: 6 * 1024 ** 2 });
    await user.upload(screen.getByLabelText("Thumbnail"), oversized);
    expect(screen.getByRole("alert")).toHaveTextContent("too large");
    expect(onChange).not.toHaveBeenCalled();
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    const valid = new File(["image"], "cover.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Thumbnail"), valid);
    expect(onChange).toHaveBeenLastCalledWith(valid);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders and releases the temporary thumbnail preview", () => {
    const file = new File(["image"], "cover.png", { type: "image/png" });
    const view = render(
      <MediaField
        kind="thumbnail"
        file={file}
        onChange={vi.fn()}
        onValidityChange={vi.fn()}
      />,
    );
    expect(screen.getByAltText("Selected thumbnail preview")).toHaveAttribute(
      "src",
      "blob:thumbnail-preview",
    );
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:thumbnail-preview");
  });

  it("allows an optional invalid file to be dismissed without blocking draft saving", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const valid = vi.fn();
    render(
      <MediaField kind="video" onChange={vi.fn()} onValidityChange={valid} />,
    );
    await user.upload(
      screen.getByLabelText("Video"),
      new File(["text"], "bad.txt", { type: "text/plain" }),
    );
    expect(valid).toHaveBeenLastCalledWith(false);
    await user.click(
      screen.getByRole("button", { name: "Continue without this file" }),
    );
    expect(valid).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows video details and explains missing media after reload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(["video"], "lesson.mp4", { type: "video/mp4" });
    const view = render(
      <MediaField
        kind="video"
        saved={{ name: file.name, size: file.size, type: file.type }}
        onChange={onChange}
        onValidityChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Reselect this file/)).toBeVisible();
    await user.upload(screen.getByLabelText("Video"), file);
    expect(onChange).toHaveBeenCalledWith(file);
    view.rerender(
      <MediaField
        kind="video"
        file={file}
        onChange={onChange}
        onValidityChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Selected: lesson.mp4/)).toBeVisible();
  });
});
