// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { authClient } from "../auth/authClient";
import { draftRepository } from "./draftRepository";
import { VerificationRequiredError } from "./publicationRules";
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
const draft = { id: "content-id", title: "API video", description: "Description", priceCents: 29, currency: "USD", status: "DRAFT", mediaStatus: "NOT_READY", version: 0, createdAt: "2026-10-10T00:00:00Z", updatedAt: "2026-10-10T00:00:00Z" };
const response = (body: unknown, status=200) => new Response(JSON.stringify(body), { status });
it("saves exact cents through the API and leaves legacy browser data unchanged", async () => {
  localStorage.setItem("creatorhub.drafts.v1", "legacy-data");
  const request = vi.spyOn(authClient, "request").mockResolvedValue(response(draft,201));
  expect(await draftRepository.save({title:"API video",description:"Description",price:"0.29"})).toMatchObject({priceCents:29,version:0});
  expect(request).toHaveBeenCalledWith("/api/content", expect.objectContaining({method:"POST",body:expect.stringContaining('"priceCents":29')}));
  expect(localStorage.getItem("creatorhub.drafts.v1")).toBe("legacy-data");
});
it("loads persisted API metadata without consulting localStorage", async () => {
  localStorage.setItem("creatorhub.drafts.v1", "broken");
  vi.spyOn(authClient,"request").mockResolvedValue(response([draft]));
  expect(await draftRepository.list()).toHaveLength(1);
});
it("maps the server identity gate into the existing verification prompt", async () => {
  vi.spyOn(authClient,"request").mockResolvedValue(response({code:"IDENTITY_VERIFICATION_REQUIRED",detail:"Verify identity"},403));
  await expect(draftRepository.publish("content-id",0)).rejects.toBeInstanceOf(VerificationRequiredError);
});
it("returns missing content only for 404 and preserves connection errors", async () => {
  const request=vi.spyOn(authClient,"request").mockResolvedValueOnce(response({},404)).mockRejectedValueOnce(new TypeError("offline"));
  expect(await draftRepository.get("missing")).toBeUndefined();
  await expect(draftRepository.get("content-id")).rejects.toThrow("offline");
  expect(request).toHaveBeenCalledTimes(2);
});
