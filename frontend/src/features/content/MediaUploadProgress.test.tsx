// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MediaUploadProgress } from "./MediaUploadProgress";
import { uploadService } from "./uploadService";

afterEach(() => { cleanup(); vi.useRealTimers(); });

it("shows accessible progress, cancellation, failure, retry, and completion", () => {
  vi.useFakeTimers();
  const file = new File(["video"], "lesson.mp4", { type: "video/mp4" });
  render(<MediaUploadProgress file={file} label="Video" />);
  expect(screen.getByRole("status")).toHaveTextContent("Waiting to start");
  fireEvent.click(screen.getByRole("button", { name: "Start video upload" }));
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole("progressbar", { name: "Video upload progress" })).toHaveAttribute("value", "20");
  fireEvent.click(screen.getByRole("button", { name: "Cancel video upload" }));
  expect(screen.getByRole("status")).toHaveTextContent("cancelled");
  fireEvent.click(screen.getByRole("button", { name: "Retry video upload" }));
  fireEvent.click(screen.getByRole("button", { name: "Simulate video failure" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
  fireEvent.click(screen.getByRole("button", { name: "Retry video upload" }));
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole("status")).toHaveTextContent("completed (simulation)");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("retains upload progress across navigation but not for a new file object", () => {
  vi.useFakeTimers();
  const file = new File(["video"], "lesson.mp4", { type: "video/mp4" });
  uploadService.start(file);
  const view = render(<MediaUploadProgress file={file} label="Video" />);
  view.unmount();
  act(() => vi.advanceTimersByTime(5000));
  const second = render(<MediaUploadProgress file={file} label="Video" />);
  expect(screen.getByRole("status")).toHaveTextContent("completed");
  second.rerender(<MediaUploadProgress file={new File(["video"], "lesson.mp4", { type: "video/mp4" })} label="Video" />);
  expect(screen.getByRole("status")).toHaveTextContent("Waiting");
});
