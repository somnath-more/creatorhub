// Files stay in memory. Persist metadata only; never serialize large files to localStorage.
type Media = { thumbnail?: File; video?: File };
const sessionFiles = new Map<string, Media>();

export function getSessionMedia(id: string): Media {
  return sessionFiles.get(id) ?? {};
}

export function setSessionMedia(id: string, media: Media) {
  sessionFiles.set(id, { ...sessionFiles.get(id), ...media });
}

export function removeSessionMedia(id: string) {
  sessionFiles.delete(id);
}
