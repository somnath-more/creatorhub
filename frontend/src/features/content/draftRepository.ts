import { z } from "zod";
import { demoMode } from '../../demo/demoMode';
import { draftRepository as localRepository } from '../../demo/localDraftRepository';
import { apiRequest, jsonRequest } from "../auth/apiRequest";
import { ApiError } from "../auth/authClient";
import { draftFormSchema, draftSchema, priceToCents, type Draft, type DraftInput, type FileMetadata } from "./draftSchema";
import { getSessionMedia } from "./sessionMedia";
import { uploadService } from "./uploadService";
import { VerificationRequiredError } from "./publicationRules";
// Legacy data identifier only: never read or written by the API adapter.
export const DRAFT_STORAGE_KEY = "creatorhub.drafts.v1";
type MediaMetadata = { thumbnail?: FileMetadata; video?: FileMetadata };
async function publication(id: string, version: number | undefined, scheduledAt?: string): Promise<Draft> {
  const media=getSessionMedia(id);
  const mediaReady=(["thumbnail","video"] as const).every(kind => !!media[kind] && uploadService.get(media[kind]!).status === "COMPLETED");
  try {
    const response=await apiRequest(`/api/content/${encodeURIComponent(id)}/${scheduledAt===undefined?"publish":"schedule"}`,
      jsonRequest("POST",{version,mediaReady,...(scheduledAt===undefined?{}:{scheduledAt})}));
    return draftSchema.parse(await response.json());
  } catch (error) {
    if(error instanceof ApiError && error.code === "IDENTITY_VERIFICATION_REQUIRED") throw new VerificationRequiredError();
    throw error;
  }
}
const apiRepository = {
  async list(): Promise<Draft[]> { return z.array(draftSchema).parse(await (await apiRequest("/api/content")).json()); },
  async get(id: string): Promise<Draft | undefined> {
    try { return draftSchema.parse(await (await apiRequest(`/api/content/${encodeURIComponent(id)}`)).json()); }
    catch(error) { if(error instanceof ApiError && error.status===404) return undefined; throw error; }
  },
  async save(input: DraftInput, id?: string, media: MediaMetadata = {}, version?: number): Promise<Draft> {
    const values=draftFormSchema.parse(input);
    const response=await apiRequest(id ? `/api/content/${encodeURIComponent(id)}` : "/api/content",jsonRequest(id?"PUT":"POST",{
      title:values.title,description:values.description,priceCents:priceToCents(values.price),...media,...(id?{version}:{}),
    }));
    return draftSchema.parse(await response.json());
  },
  async remove(id: string, version?: number): Promise<void> {
    await apiRequest(`/api/content/${encodeURIComponent(id)}?version=${version ?? ""}`,{method:"DELETE"});
  },
  publish: (id: string, version?: number) => publication(id,version),
  schedule: (id: string, scheduledAt: string, version?: number) => publication(id,version,scheduledAt),
};
export const draftRepository: typeof apiRepository = demoMode ? localRepository : apiRepository;
