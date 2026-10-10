// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { PortalRoutes } from "../../App";
import { AuthContext } from "../auth/authContext";
import { authClient } from "../auth/authClient";
import type { Draft } from "./draftSchema";

let records: Draft[];
beforeEach(() => { records=[];localStorage.clear(); });
afterEach(() => { cleanup();vi.restoreAllMocks(); });
const response=(body: unknown,status=200)=>new Response(JSON.stringify(body),{status});
function transport() {
  return vi.spyOn(authClient,"request").mockImplementation(async(path,init={})=>{
    const method=init.method ?? "GET";
    if(path==="/api/content" && method==="POST") {
      const input=JSON.parse(String(init.body));
      const item: Draft={...input,id:crypto.randomUUID(),currency:"USD",status:"DRAFT",mediaStatus:"NOT_READY",version:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      records.push(item);return response(item,201);
    }
    if(path==="/api/content") return response(records);
    const id=path.split("/")[3]?.split("?")[0];
    if(path.endsWith("/publish")) return response({code:"IDENTITY_VERIFICATION_REQUIRED",detail:"Verify identity"},403);
    const item=records.find(record=>record.id===id);
    if(!item) return response({},404);
    if(method==="PUT") { Object.assign(item,JSON.parse(String(init.body)),{version:item.version!+1});return response(item); }
    if(method==="DELETE") { records=records.filter(record=>record.id!==id);return new Response(null,{status:204}); }
    return response(item);
  });
}
function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{client:authClient,state:{status:"authenticated",session:{accessToken:"token",tokenType:"Bearer",expiresIn:900,creator:{userId:"api-flow",creatorId:"creator",fullName:"API Creator",email:"creator@example.com",emailVerified:true}}}}}><PortalRoutes /></AuthContext.Provider></MemoryRouter>);
}
it("creates through API, reloads the persisted draft, edits and confirms deletion",async()=>{
  const request=transport(),user=userEvent.setup();
  let view=open("/content/new");
  await user.type(screen.getByLabelText("Title"),"Persistent video");
  await user.type(screen.getByLabelText("Description"),"A database-backed draft");
  await user.clear(screen.getByLabelText("Price (USD)"));await user.type(screen.getByLabelText("Price (USD)"),"0.29");
  await user.click(screen.getByRole("button",{name:"Save draft"}));
  expect(await screen.findByRole("heading",{name:"Persistent video"})).toBeVisible();
  expect(records[0].priceCents).toBe(29);expect(localStorage.length).toBe(0);
  view.unmount();view=open("/content");
  expect(await screen.findByRole("heading",{name:"Persistent video"})).toBeVisible();
  await user.click(screen.getByRole("link",{name:"Edit Persistent video"}));
  await screen.findByDisplayValue("Persistent video");
  await user.clear(screen.getByLabelText("Title"));await user.type(screen.getByLabelText("Title"),"Updated API video");
  await user.click(screen.getByRole("button",{name:"Save draft"}));
  await screen.findByRole("heading",{name:"Updated API video"});
  expect(request.mock.calls.some(([,init])=>init?.method==="PUT" && JSON.parse(String(init.body)).version===0)).toBe(true);
  await user.click(screen.getByRole("button",{name:"Delete Updated API video"}));
  expect(records).toHaveLength(1);
  await user.click(screen.getByRole("button",{name:"Confirm delete"}));
  await waitFor(()=>expect(records).toHaveLength(0));
  expect(await screen.findByText("Content deleted.")).toBeVisible();view.unmount();
},15000);
it("shows verification guidance when the publish endpoint rejects an unverified account",async()=>{
  transport();records=[{id:"sample-content",title:"Draft video",description:"Description",priceCents:100,currency:"USD",status:"DRAFT",mediaStatus:"NOT_READY",version:2,createdAt:"2026-10-10T00:00:00Z",updatedAt:"2026-10-10T00:00:00Z"}];
  open("/content/sample-content");
  await userEvent.click(await screen.findByRole("button",{name:"Publish now"}));
  expect(await screen.findByRole("region",{name:"Verification required"})).toBeVisible();
  expect(screen.getByRole("link",{name:"Start verification"})).toHaveAttribute("href",expect.stringContaining("returnTo="));
  expect(records[0].status).toBe("DRAFT");
});
it("preserves entered form values when an API save fails",async()=>{
  vi.spyOn(authClient,"request").mockResolvedValue(response({detail:"The service is unavailable. Try again."},503));
  open("/content/new");const user=userEvent.setup();
  await user.type(screen.getByLabelText("Title"),"Keep this title");
  await user.type(screen.getByLabelText("Description"),"Keep this description");
  await user.click(screen.getByRole("button",{name:"Save draft"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("service is unavailable");
  expect(screen.getByLabelText("Title")).toHaveValue("Keep this title");
  expect(screen.getByLabelText("Description")).toHaveValue("Keep this description");
});
it("hides simulated approval when the server disables the demo control",async()=>{
  vi.spyOn(authClient,"request").mockResolvedValue(response({status:"SUBMITTED",step:4,personal:{fullName:"Fictional Creator",dateOfBirth:"1995-04-18",country:"India"},documentType:"PASSPORT",submittedAt:"2026-10-10T00:00:00Z",demoApprovalEnabled:false}));
  open("/verification");
  expect(await screen.findByRole("heading",{name:"Verification submitted"})).toBeVisible();
  expect(screen.queryByRole("button",{name:"Simulate approval (demo)"})).not.toBeInTheDocument();
  expect(screen.getByText(/Simulated approval is disabled/)).toBeVisible();
});
