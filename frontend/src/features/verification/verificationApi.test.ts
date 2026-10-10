// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { authClient } from "../auth/authClient";
import { verificationRepository } from "./verificationRepository";
import { emptyProgress } from "./verificationSchema";
afterEach(()=>vi.restoreAllMocks());
it("persists workflow evidence through the API without client approval timestamps",async()=>{
  const request=vi.spyOn(authClient,"request").mockResolvedValue(new Response(JSON.stringify({...emptyProgress,status:"IN_PROGRESS",demoApprovalEnabled:false})));
  await verificationRepository.save({...emptyProgress,status:"IN_PROGRESS"},{documentSelected:false,selfieSelected:false});
  expect(request).toHaveBeenCalledWith("/api/verification",expect.objectContaining({method:"PUT"}));
  const body=JSON.parse(String(request.mock.calls[0][1]?.body));
  expect(body).toMatchObject({status:"IN_PROGRESS",step:1,documentSelected:false});
  expect(body).not.toHaveProperty("approvedAt");expect(body).not.toHaveProperty("submittedAt");
});
it("reports a disabled approval endpoint instead of changing local verification state",async()=>{
  vi.spyOn(authClient,"request").mockResolvedValue(new Response(JSON.stringify({detail:"Simulated approval is disabled in this environment."}),{status:403}));
  await expect(verificationRepository.simulateApproval()).rejects.toThrow("disabled");
});
