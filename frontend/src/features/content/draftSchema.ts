import { z } from "zod";

export const draftFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(120, "Use 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(5000, "Use 5,000 characters or fewer."),
  price: z
    .string()
    .trim()
    .regex(
      /^\d{1,6}(\.\d{1,2})?$/,
      "Enter a price from 0 to 999,999.99 with at most two decimal places.",
    ),
});

export type DraftInput = z.infer<typeof draftFormSchema>;

export const fileMetadataSchema = z.object({
  name: z.string(),
  size: z.number().nonnegative(),
  type: z.string(),
});
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export const draftSchema = z
  .object({
    id: z.string().min(1),
    title: draftFormSchema.shape.title,
    description: draftFormSchema.shape.description,
    priceCents: z.number().int().min(0).max(99999999),
    currency: z.literal("USD"),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
    mediaStatus: z.enum(["NOT_READY", "READY"]).default("NOT_READY"),
    scheduledAt: z.iso.datetime().optional(),
    publishedAt: z.iso.datetime().optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    thumbnail: fileMetadataSchema.optional(),
    video: fileMetadataSchema.optional(),
  })
  .superRefine((content, context) => {
    if (
      content.status !== "DRAFT" &&
      (content.mediaStatus !== "READY" || !content.thumbnail || !content.video)
    )
      context.addIssue({
        code: "custom",
        message: "Published and scheduled content requires ready media.",
      });
    if (content.status === "SCHEDULED" && !content.scheduledAt)
      context.addIssue({
        code: "custom",
        message: "Scheduled content requires a publication date.",
      });
    if (content.status === "PUBLISHED" && !content.publishedAt)
      context.addIssue({
        code: "custom",
        message: "Published content requires a publication timestamp.",
      });
  });
export type Draft = z.infer<typeof draftSchema>;

export function priceToCents(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
