// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { accountKey, setAccountScope } from "./accountScope";
import { verificationRepository } from "../verification/verificationRepository";
import { emptyProgress } from "../verification/verificationSchema";
import { setSessionMedia, getSessionMedia } from "../content/sessionMedia";
afterEach(() => { setAccountScope(null); localStorage.clear(); });
it("isolates verification and media by account without adopting anonymous data", async () => {
  localStorage.setItem("creatorhub.verification.v1", "legacy-data");
  setAccountScope("first");
  await verificationRepository.save({ ...emptyProgress, personal: { ...emptyProgress.personal, fullName: "First" }, status: "IN_PROGRESS" });
  setSessionMedia("shared-id", { video: new File(["video"], "first.mp4") });
  setAccountScope("second");
  expect((await verificationRepository.load()).personal.fullName).not.toBe("First");
  expect(getSessionMedia("shared-id").video).toBeUndefined();
  expect(accountKey("demo")).toBe("demo:second");
  setAccountScope("first");
  expect((await verificationRepository.load()).personal.fullName).toBe("First");
  expect(localStorage.getItem("creatorhub.verification.v1")).toBe("legacy-data");
});
