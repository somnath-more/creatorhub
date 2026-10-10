import { apiRequest, jsonRequest } from "../auth/apiRequest";
import { demoMode } from '../../demo/demoMode';
import { verificationRepository as localRepository } from '../../demo/localVerificationRepository';
import { progressSchema, type VerificationProgress } from "./verificationSchema";
export const VERIFICATION_KEY = "creatorhub.verification.v1";
const apiRepository = {
  async load(): Promise<VerificationProgress> { return progressSchema.parse(await (await apiRequest("/api/verification")).json()); },
  async save(progress: VerificationProgress, evidence: { documentSelected?: boolean; selfieSelected?: boolean } = {}): Promise<VerificationProgress> {
    const validated=progressSchema.parse(progress);
    const response=await apiRequest("/api/verification",jsonRequest("PUT",{
      status:validated.status,step:validated.step,personal:validated.personal,documentType:validated.documentType,...evidence,
    }));
    return progressSchema.parse(await response.json());
  },
  async simulateApproval(): Promise<VerificationProgress> {
    return progressSchema.parse(await (await apiRequest("/api/verification/demo-approval",{method:"POST"})).json());
  },
};
export const verificationRepository: typeof apiRepository = demoMode ? localRepository : apiRepository;
