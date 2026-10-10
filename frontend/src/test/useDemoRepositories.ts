// Legacy UI regression fixtures only. Production never imports these adapters.
import { vi } from "vitest";
vi.mock("../features/content/draftRepository", () => import("./localDraftRepository"));
vi.mock("../features/verification/verificationRepository", () => import("./localVerificationRepository"));
