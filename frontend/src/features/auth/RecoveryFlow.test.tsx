// @vitest-environment jsdom
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { RecoveryPage } from "./RecoveryPage";
import { AuthContext } from "./authContext";
import { AuthClient } from "./authClient";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });
function open(mode: "forgot-password" | "reset-password" | "verify-email", token = "a".repeat(43)) {
  window.history.replaceState(null, "", `/${mode}#token=${token}`);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
  render(<StrictMode><MemoryRouter><AuthContext.Provider value={{ client: new AuthClient(), state: { status: "anonymous", session: null } }}><RecoveryPage mode={mode} /></AuthContext.Provider></MemoryRouter></StrictMode>);
}
it("validates email and shows the generic reset request result", async () => {
  open("forgot-password"); const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(screen.getByRole("alert")).toHaveTextContent("valid email");
  expect(fetch).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Email"), "creator@example.com");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(await screen.findByRole("status")).toHaveTextContent("If eligible");
});
it("scrubs the token and requires confirmation before verification", async () => {
  open("verify-email");
  expect(window.location.hash).toBe(""); expect(fetch).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Verify email" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Email verified");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer", body: JSON.stringify({ token: "a".repeat(43) }) });
});
it("validates matching passwords and handles expired links", async () => {
  open("reset-password"); const user = userEvent.setup();
  await user.type(screen.getByLabelText("New password"), "new-password-123");
  await user.type(screen.getByLabelText("Confirm password"), "different-password");
  await user.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords must match"); expect(fetch).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText("Confirm password"));
  await user.type(screen.getByLabelText("Confirm password"), "new-password-123");
  vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 400 }));
  await user.click(screen.getByRole("button", { name: "Update password" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("invalid or expired");
});
it("rejects missing tokens without making a request", () => {
  open("verify-email", ""); expect(screen.getByRole("alert")).toHaveTextContent("missing or invalid"); expect(fetch).not.toHaveBeenCalled();
});
it("lets an authenticated creator resend verification and reports delivery request", async () => {
  const client = new AuthClient();
  const request = vi.spyOn(client, "request").mockResolvedValue(new Response(null, { status: 202 }));
  render(<AuthContext.Provider value={{ client, state: { status: "authenticated", session: { accessToken: "token", tokenType: "Bearer", expiresIn: 900, creator: { userId: "user", creatorId: "creator", email: "creator@example.com", fullName: "Creator", emailVerified: false } } } }}><EmailVerificationBanner /></AuthContext.Provider>);
  await userEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Check your inbox");
  expect(request).toHaveBeenCalledWith("/api/account/email-verification/resend", { method: "POST" });
});
