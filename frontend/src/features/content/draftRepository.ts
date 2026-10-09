import { z } from "zod";
import {
  draftFormSchema,
  draftSchema,
  priceToCents,
  type Draft,
  type DraftInput,
  type FileMetadata,
} from "./draftSchema";

export const DRAFT_STORAGE_KEY = "creatorhub.drafts.v1";
type MediaMetadata = { thumbnail?: FileMetadata; video?: FileMetadata };

function read(): Draft[] {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw === null ? [] : z.array(draftSchema).parse(JSON.parse(raw));
  } catch {
    throw new Error(
      "Your local drafts could not be read. Check browser storage and try again. Existing data has not been changed.",
    );
  }
}

function write(drafts: Draft[]) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    throw new Error(
      "Your draft could not be saved. Browser storage may be full or unavailable. Keep this page open and try again.",
    );
  }
}

// Async boundary allows a later API implementation without changing the pages.
export const draftRepository = {
  async list(): Promise<Draft[]> {
    return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id: string): Promise<Draft | undefined> {
    return read().find((draft) => draft.id === id);
  },
  async save(
    input: DraftInput,
    id?: string,
    media: MediaMetadata = {},
  ): Promise<Draft> {
    const values = draftFormSchema.parse(input);
    const drafts = read();
    const existing = id ? drafts.find((draft) => draft.id === id) : undefined;
    if (id && !existing)
      throw new Error(
        "This draft no longer exists. Return to your content library.",
      );
    const now = new Date().toISOString();
    const draft: Draft = {
      ...existing,
      id: existing?.id ?? crypto.randomUUID(),
      title: values.title,
      description: values.description,
      priceCents: priceToCents(values.price),
      currency: "USD",
      status: "DRAFT",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...media,
    };
    draftSchema.parse(draft);
    write([draft, ...drafts.filter((item) => item.id !== draft.id)]);
    return draft;
  },
  async remove(id: string): Promise<void> {
    const drafts = read();
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(drafts.filter((draft) => draft.id !== id)),
      );
    } catch {
      throw new Error(
        "Your draft could not be deleted. Browser storage is unavailable. Try again.",
      );
    }
  },
};
