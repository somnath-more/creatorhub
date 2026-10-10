import {
  emptyProgress,
  progressSchema,
  type VerificationProgress,
} from "../features/verification/verificationSchema";
import { accountKey, captureAccount } from "../features/auth/accountScope";

export const VERIFICATION_KEY = "creatorhub.verification.v1";

export const verificationRepository = {
  async load(): Promise<VerificationProgress> {
    try {
      const raw = localStorage.getItem(accountKey(VERIFICATION_KEY));
      return raw === null
        ? structuredClone(emptyProgress)
        : progressSchema.parse(JSON.parse(raw));
    } catch {
      throw new Error(
        "Verification progress could not be read. Check browser storage and try again. Existing data has not been changed.",
      );
    }
  },
  async save(progress: VerificationProgress): Promise<VerificationProgress> {
    const validated = progressSchema.parse(progress);
    try {
      localStorage.setItem(accountKey(VERIFICATION_KEY), JSON.stringify(validated));
      return validated;
    } catch {
      throw new Error(
        "Verification progress could not be saved. Keep this page open, check browser storage, and try again.",
      );
    }
  },
  async simulateApproval(): Promise<VerificationProgress> {
    const checkAccount = captureAccount();
    const progress = await verificationRepository.load();
    checkAccount();
    if (progress.status !== "SUBMITTED")
      throw new Error(
        "Verification must be submitted before simulating approval.",
      );
    return verificationRepository.save({
      ...progress,
      status: "VERIFIED",
      approvedAt: new Date().toISOString(),
    });
  },
};
