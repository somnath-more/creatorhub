import { z } from "zod";
import { accountKey, captureAccount } from "../auth/accountScope";
import {
  requireSelectedMedia,
  requireVerifiedCreator,
} from "./publicationRules";
import { verificationRepository } from "../verification/verificationRepository";
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
    const raw = localStorage.getItem(accountKey(DRAFT_STORAGE_KEY));
    return raw === null ? [] : z.array(draftSchema).parse(JSON.parse(raw));
  } catch {
    throw new Error(
      "Your local drafts could not be read. Check browser storage and try again. Existing data has not been changed.",
    );
  }
}

function write(drafts: Draft[]) {
  try {
    localStorage.setItem(accountKey(DRAFT_STORAGE_KEY), JSON.stringify(drafts));
  } catch {
    throw new Error(
      "Your draft could not be saved. Browser storage may be full or unavailable. Keep this page open and try again.",
    );
  }
}

async function processDue(now = new Date()) {
  const checkAccount = captureAccount();
  const isDue = (content: Draft) =>
    content.status === "SCHEDULED" &&
    content.mediaStatus === "READY" &&
    !!content.scheduledAt &&
    new Date(content.scheduledAt) <= now;
  if (!read().some(isDue)) return;
  if ((await verificationRepository.load()).status !== "VERIFIED") return;
  checkAccount();
  const records = read();
  if (!records.some(isDue)) return;
  write(
    records.map((content) =>
      isDue(content)
        ? {
            ...content,
            status: "PUBLISHED",
            publishedAt: now.toISOString(),
            updatedAt: now.toISOString(),
          }
        : content,
    ),
  );
}

async function publishOrSchedule(
  id: string,
  scheduledAt?: string,
): Promise<Draft> {
  const checkAccount = captureAccount();
  await requireVerifiedCreator();
  checkAccount();
  const records = read();
  const content = records.find((item) => item.id === id);
  if (!content) throw new Error("This content no longer exists.");
  if (content.status === "PUBLISHED")
    throw new Error(
      "This content is already published. Edit and save it as a draft to publish changes.",
    );
  requireSelectedMedia(content);
  if (
    scheduledAt &&
    (!z.iso.datetime({ offset: true }).safeParse(scheduledAt).success ||
      !Number.isFinite(Date.parse(scheduledAt)) ||
      Date.parse(scheduledAt) <= Date.now())
  )
    throw new Error("Choose a valid publication date in the future.");
  const now = new Date().toISOString();
  const updated = draftSchema.parse({
    ...content,
    status: scheduledAt ? "SCHEDULED" : "PUBLISHED",
    mediaStatus: "READY",
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    publishedAt: scheduledAt ? undefined : now,
    updatedAt: now,
  });
  write(records.map((item) => (item.id === id ? updated : item)));
  return updated;
}

// Async boundary allows a later API implementation without changing the pages.
export const draftRepository = {
  async list(): Promise<Draft[]> {
    const checkAccount = captureAccount();
    await processDue();
    checkAccount();
    return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id: string): Promise<Draft | undefined> {
    const checkAccount = captureAccount();
    await processDue();
    checkAccount();
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
      mediaStatus: "NOT_READY",
      scheduledAt: undefined,
      publishedAt: undefined,
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
        accountKey(DRAFT_STORAGE_KEY),
        JSON.stringify(drafts.filter((draft) => draft.id !== id)),
      );
    } catch {
      throw new Error(
        "Your draft could not be deleted. Browser storage is unavailable. Try again.",
      );
    }
  },
  publish: (id: string) => publishOrSchedule(id),
  schedule: (id: string, scheduledAt: string) => {
    if (!scheduledAt)
      return Promise.reject(
        new Error("Choose a valid publication date in the future."),
      );
    return publishOrSchedule(id, scheduledAt);
  },
  processDue,
};
