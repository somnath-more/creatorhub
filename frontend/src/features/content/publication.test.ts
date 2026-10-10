import "../../test/useDemoRepositories";
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftRepository } from "../../test/localDraftRepository";
import { setSessionMedia, removeSessionMedia } from "./sessionMedia";
import { verificationRepository } from "../verification/verificationRepository";
import { uploadService } from "./uploadService";

const input = {
  title: "Ready video",
  description: "A sample video.",
  price: "12.50",
};
const metadata = {
  thumbnail: { name: "cover.png", type: "image/png", size: 5 },
  video: { name: "video.mp4", type: "video/mp4", size: 5 },
};
async function ready() {
  const content = await draftRepository.save(input, undefined, metadata);
  const files = {
    thumbnail: new File(["image"], "cover.png", { type: "image/png" }),
    video: new File(["video"], "video.mp4", { type: "video/mp4" }),
  };
  setSessionMedia(content.id, files);
  vi.useFakeTimers();
  Object.values(files).forEach((file) => uploadService.start(file));
  vi.advanceTimersByTime(5000);
  vi.useRealTimers();
  return content;
}
async function approve() {
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
  return verificationRepository.simulateApproval();
}
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("demo publication rules", () => {
  it("blocks incomplete uploads even when files match saved metadata", async () => {
    await approve();
    const content = await ready();
    const replacement = new File(["video"], "video.mp4", { type: "video/mp4" });
    setSessionMedia(content.id, { video: replacement });
    await expect(draftRepository.publish(content.id)).rejects.toThrow("Complete both simulated uploads");
    await expect(draftRepository.schedule(content.id, "2999-01-01T12:00:00Z")).rejects.toThrow("Complete both simulated uploads");
    expect((await draftRepository.get(content.id))?.status).toBe("DRAFT");
  });
  it("loads legacy drafts without discarding existing data", async () => {
    const content = await draftRepository.save(input);
    const { mediaStatus: omitted, ...legacy } = content;
    expect(omitted).toBe("NOT_READY");
    localStorage.setItem("creatorhub.drafts.v1", JSON.stringify([legacy]));
    expect(await draftRepository.get(content.id)).toMatchObject({
      title: input.title,
      mediaStatus: "NOT_READY",
    });
  });

  it("cancels a schedule when edits are saved as a draft", async () => {
    await approve();
    const content = await ready();
    const due = new Date(Date.now() + 60000);
    await draftRepository.schedule(content.id, due.toISOString());
    await draftRepository.save(
      { ...input, title: "Updated draft" },
      content.id,
    );
    await draftRepository.processDue(due);
    expect(await draftRepository.get(content.id)).toMatchObject({
      status: "DRAFT",
      title: "Updated draft",
    });
  });

  it("normalizes explicit timezone offsets to UTC", async () => {
    await approve();
    const content = await ready();
    const scheduled = await draftRepository.schedule(
      content.id,
      "2999-01-01T18:00:00+05:30",
    );
    expect(scheduled.scheduledAt).toBe("2999-01-01T12:30:00.000Z");
  });

  it("blocks publishing and scheduling for unverified creators without changing the draft", async () => {
    const content = await ready();
    await expect(draftRepository.publish(content.id)).rejects.toThrow(
      "verification",
    );
    await expect(
      draftRepository.schedule(
        content.id,
        new Date(Date.now() + 60000).toISOString(),
      ),
    ).rejects.toThrow("verification");
    expect((await draftRepository.get(content.id))?.status).toBe("DRAFT");
  });
  it("requires submitted verification before simulated approval", async () => {
    await expect(verificationRepository.simulateApproval()).rejects.toThrow(
      "submitted",
    );
    expect((await approve()).status).toBe("VERIFIED");
  });
  it("publishes selected media after approval and returns edited content to draft", async () => {
    await approve();
    const content = await ready();
    const published = await draftRepository.publish(content.id);
    expect(published).toMatchObject({
      status: "PUBLISHED",
      mediaStatus: "READY",
    });
    expect(published.publishedAt).toBeDefined();
    const edited = await draftRepository.save(
      { ...input, title: "Revised" },
      content.id,
    );
    expect(edited.status).toBe("DRAFT");
    expect(edited.publishedAt).toBeUndefined();
    expect(edited.scheduledAt).toBeUndefined();
  });
  it("does not treat stored filenames as selected media after reload", async () => {
    await approve();
    const content = await ready();
    removeSessionMedia(content.id);
    await expect(draftRepository.publish(content.id)).rejects.toThrow(
      "Reselect",
    );
  });
  it("rejects past, present, and invalid schedules", async () => {
    await approve();
    const content = await ready();
    for (const date of [
      "invalid",
      "2999-02-31T12:00:00Z",
      "2000-01-01T00:00:00Z",
      new Date(Date.now() - 1).toISOString(),
    ]) {
      await expect(draftRepository.schedule(content.id, date)).rejects.toThrow(
        "future",
      );
    }
  });
  it("publishes due schedules on reconciliation and retains the original schedule", async () => {
    await approve();
    const content = await ready();
    const due = new Date(Date.now() + 60000);
    await draftRepository.schedule(content.id, due.toISOString());
    removeSessionMedia(content.id);
    expect((await draftRepository.get(content.id))?.status).toBe("SCHEDULED");
    await draftRepository.processDue(due);
    expect(await draftRepository.get(content.id)).toMatchObject({
      status: "PUBLISHED",
      scheduledAt: due.toISOString(),
      mediaStatus: "READY",
    });
  });
  it("rechecks verification before automatically publishing due content", async () => {
    await approve();
    const content = await ready();
    const due = new Date(Date.now() + 60000);
    await draftRepository.schedule(content.id, due.toISOString());
    localStorage.removeItem("creatorhub.verification.v1");
    await draftRepository.processDue(due);
    expect((await draftRepository.get(content.id))?.status).toBe("SCHEDULED");
  });
  it("preserves draft state when publication cannot be persisted", async () => {
    await approve();
    const content = await ready();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    await expect(draftRepository.publish(content.id)).rejects.toThrow(
      "could not be saved",
    );
    expect((await draftRepository.get(content.id))?.status).toBe("DRAFT");
  });
});
