import { z } from "zod";

function validPastDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return value < today;
}

export const personalSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Enter your full name.")
    .max(100, "Use 100 characters or fewer."),
  dateOfBirth: z
    .string()
    .refine(validPastDate, "Enter a valid date of birth in the past."),
  country: z
    .string()
    .trim()
    .min(1, "Enter your country.")
    .max(80, "Use 80 characters or fewer."),
});
export type PersonalInformation = z.infer<typeof personalSchema>;
export const documentTypes = [
  "PASSPORT",
  "NATIONAL_ID",
  "DRIVING_LICENSE",
] as const;
export type DocumentType = (typeof documentTypes)[number] | "";

export const progressSchema = z
  .object({
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "VERIFIED"]),
    step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    personal: z.object({
      fullName: z.string().max(100),
      dateOfBirth: z.string().max(10),
      country: z.string().max(80),
    }),
    documentType: z.union([z.literal(""), z.enum(documentTypes)]),
    submittedAt: z.iso.datetime().optional(),
    approvedAt: z.iso.datetime().optional(),
  })
  .superRefine((value, context) => {
    if (value.step >= 2 && !personalSchema.safeParse(value.personal).success)
      context.addIssue({
        code: "custom",
        message: "Complete personal information before continuing.",
      });
    if (value.step >= 3 && !value.documentType)
      context.addIssue({
        code: "custom",
        message: "Select an identification type.",
      });
    if (
      value.status === "SUBMITTED" || value.status === "VERIFIED"
        ? value.step !== 4 || !value.submittedAt
        : value.step === 4 || !!value.submittedAt
    )
      context.addIssue({
        code: "custom",
        message: "Invalid submission state.",
      });
    if (value.status === "NOT_STARTED" && value.step !== 1)
      context.addIssue({ code: "custom", message: "Invalid starting state." });
    if (value.status === "VERIFIED" ? !value.approvedAt : !!value.approvedAt)
      context.addIssue({
        code: "custom",
        message: "Verified demo state requires explicit approval.",
      });
  });
export type VerificationProgress = z.infer<typeof progressSchema>;
export const emptyProgress: VerificationProgress = {
  status: "NOT_STARTED",
  step: 1,
  personal: { fullName: "", dateOfBirth: "", country: "" },
  documentType: "",
};
