import "../../test/useDemoRepositories";
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftRepository, DRAFT_STORAGE_KEY } from "./draftRepository";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const input = {
  title: "First video",
  description: "A useful introduction.",
  price: "12.35",
};

describe("local draft repository", () => {
  it("persists metadata, preserves exact cents, and edits without duplicating", async () => {
    const draft = await draftRepository.save(input);
    expect(draft.priceCents).toBe(1235);
    expect(draft.status).toBe("DRAFT");
    expect(JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)!)).toHaveLength(
      1,
    );
    await draftRepository.save(
      { ...input, title: "Updated", price: "0.29" },
      draft.id,
    );
    const drafts = await draftRepository.list();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ title: "Updated", priceCents: 29 });
    await draftRepository.remove(draft.id);
    expect(await draftRepository.list()).toEqual([]);
  });

  it.each(["-1", "1.001", "abc", "", "1000000"])(
    "rejects invalid price %s",
    async (price) => {
      await expect(draftRepository.save({ ...input, price })).rejects.toThrow();
      expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    },
  );

  it("does not replace corrupted stored data with an empty library", async () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, "{broken");
    await expect(draftRepository.list()).rejects.toThrow("could not be read");
    await expect(draftRepository.save(input)).rejects.toThrow();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe("{broken");
  });

  it("reports storage failure and does not change an existing draft", async () => {
    const draft = await draftRepository.save(input);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    await expect(
      draftRepository.save({ ...input, title: "Lost update" }, draft.id),
    ).rejects.toThrow("could not be saved");
    expect((await draftRepository.list())[0].title).toBe(input.title);
  });

  it("does not silently recreate a deleted draft during editing", async () => {
    await expect(draftRepository.save(input, "missing")).rejects.toThrow(
      "no longer exists",
    );
  });
});
