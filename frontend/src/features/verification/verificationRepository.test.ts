// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  verificationRepository,
  VERIFICATION_KEY,
} from "./verificationRepository";

const personal = {
  fullName: "Sample Creator",
  dateOfBirth: "1995-04-18",
  country: "IN",
};
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("verification persistence", () => {
  it("starts unverified and persists progress without identity files", async () => {
    expect((await verificationRepository.load()).status).toBe("NOT_STARTED");
    await verificationRepository.save({
      status: "IN_PROGRESS",
      step: 2,
      personal,
      documentType: "",
    });
    expect(await verificationRepository.load()).toMatchObject({
      status: "IN_PROGRESS",
      step: 2,
      personal,
    });
    expect(
      Object.keys(JSON.parse(localStorage.getItem(VERIFICATION_KEY)!)),
    ).not.toContain("document");
  });

  it("rejects inconsistent submitted state", async () => {
    await expect(
      verificationRepository.save({
        status: "SUBMITTED",
        step: 2,
        personal,
        documentType: "PASSPORT",
      }),
    ).rejects.toThrow();
  });

  it("reports corrupted data without overwriting it", async () => {
    localStorage.setItem(VERIFICATION_KEY, "broken");
    await expect(verificationRepository.load()).rejects.toThrow(
      "could not be read",
    );
    expect(localStorage.getItem(VERIFICATION_KEY)).toBe("broken");
  });

  it("reports blocked storage without changing saved progress", async () => {
    await verificationRepository.save({
      status: "IN_PROGRESS",
      step: 2,
      personal,
      documentType: "",
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });
    await expect(
      verificationRepository.save({
        status: "IN_PROGRESS",
        step: 3,
        personal,
        documentType: "PASSPORT",
      }),
    ).rejects.toThrow("could not be saved");
    expect((await verificationRepository.load()).step).toBe(2);
  });
});
