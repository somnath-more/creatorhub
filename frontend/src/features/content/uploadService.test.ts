// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { uploadService } from "./uploadService";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const video = () => new File(["video"], "lesson.mp4", { type: "video/mp4" });

it("reports progress and completes without reading or sending the file", () => {
  vi.useFakeTimers();
  const file = video();
  expect(uploadService.get(file).status).toBe("WAITING");
  uploadService.start(file);
  vi.advanceTimersByTime(1000);
  expect(uploadService.get(file)).toEqual({ status: "UPLOADING", progress: 20 });
  vi.advanceTimersByTime(4000);
  expect(uploadService.get(file)).toEqual({ status: "COMPLETED", progress: 100 });
});

it("cancels, ignores late ticks, and retries from zero", () => {
  vi.useFakeTimers();
  const file = video();
  uploadService.start(file);
  vi.advanceTimersByTime(1000);
  uploadService.cancel(file);
  vi.advanceTimersByTime(5000);
  expect(uploadService.get(file)).toEqual({ status: "CANCELLED", progress: 20 });
  uploadService.start(file);
  expect(uploadService.get(file)).toEqual({ status: "UPLOADING", progress: 0 });
  vi.advanceTimersByTime(5000);
  expect(uploadService.get(file).status).toBe("COMPLETED");
});

it("fails when offline and recovers on an explicit retry", () => {
  vi.useFakeTimers();
  const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  const file = video();
  uploadService.start(file);
  vi.advanceTimersByTime(250);
  expect(uploadService.get(file).status).toBe("FAILED");
  online.mockReturnValue(true);
  uploadService.start(file);
  vi.advanceTimersByTime(5000);
  expect(uploadService.get(file).status).toBe("COMPLETED");
  expect(uploadService.get(video()).status).toBe("WAITING");
});

it("exposes an explicit failure simulation without completing later", () => {
  vi.useFakeTimers();
  const file = video();
  uploadService.start(file);
  uploadService.simulateFailure(file);
  vi.advanceTimersByTime(5000);
  expect(uploadService.get(file).status).toBe("FAILED");
});
