// Files stay in memory. Persist metadata only; never serialize large files to localStorage.
type Media = { thumbnail?: File; video?: File };
import { accountKey } from "../auth/accountScope";
const sessionFiles = new Map<string, Media>();

export function getSessionMedia(id: string): Media {
  return sessionFiles.get(accountKey(id)) ?? {};
}

export function setSessionMedia(id: string, media: Media) {
  sessionFiles.set(accountKey(id), { ...sessionFiles.get(accountKey(id)), ...media });
}

export function removeSessionMedia(id: string) {
  sessionFiles.delete(accountKey(id));
}
