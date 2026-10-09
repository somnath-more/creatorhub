import { verificationRepository } from "../verification/verificationRepository";
import type { Draft } from "./draftSchema";
import { getSessionMedia } from "./sessionMedia";

export class VerificationRequiredError extends Error {
  constructor() {
    super(
      "Account verification is required before publishing or scheduling. Submit verification and use the clearly labelled demo approval action.",
    );
  }
}

export async function requireVerifiedCreator() {
  if ((await verificationRepository.load()).status !== "VERIFIED")
    throw new VerificationRequiredError();
}

export function requireSelectedMedia(content: Draft) {
  const media = getSessionMedia(content.id);
  for (const kind of ["thumbnail", "video"] as const) {
    const file = media[kind];
    const metadata = content[kind];
    const types =
      kind === "thumbnail"
        ? ["image/jpeg", "image/png", "image/webp"]
        : ["video/mp4", "video/webm", "video/quicktime"];
    const maximum = kind === "thumbnail" ? 5 * 1024 ** 2 : 2 * 1024 ** 3;
    if (
      !file ||
      !metadata ||
      file.name !== metadata.name ||
      file.size !== metadata.size ||
      file.type !== metadata.type ||
      !types.includes(file.type) ||
      file.size <= 0 ||
      file.size > maximum
    ) {
      throw new Error(
        "Reselect and save both a valid thumbnail and video in the editor before publishing or scheduling.",
      );
    }
  }
}
