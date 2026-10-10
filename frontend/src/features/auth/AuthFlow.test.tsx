// @vitest-environment jsdom
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { PortalRoutes } from "../../App";
import { AuthProvider } from "./AuthProvider";
import { AuthClient } from "./authClient";
const session = { accessToken: "token", tokenType: "Bearer", expiresIn: 900,
  creator: { userId: "flow-user", creatorId: "creator", fullName: "Flow Creator", email: "flow@example.com" } };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("csrf") ? new Response() : response({}, 401)));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });
function open(path = "/") {
  const client = new AuthClient();
  render(<StrictMode><MemoryRouter initialEntries={[path]}><AuthProvider client={client}><PortalRoutes /></AuthProvider></MemoryRouter></StrictMode>);
  return client;
}
it("redirects anonymous portal visitors to login and restores their requested route", async () => {
  open("/content");
  await screen.findByRole("heading", { name: "Sign in" });
  const fetcher = vi.mocked(fetch);
  fetcher.mockImplementation(async (url) => String(url).endsWith("csrf") ? new Response() : response(session));
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "flow@example.com");
  await user.type(screen.getByLabelText("Password"), "test-password-123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByRole("heading", { name: "Content" });
  expect(screen.getByText("Flow Creator")).toBeVisible();
  expect(fetcher.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
});
it("validates registration before submitting and reports success on login", async () => {
  open("/register");
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("Enter your full name.")).toBeVisible();
  await user.type(screen.getByLabelText("Full name"), "Flow Creator");
  await user.type(screen.getByLabelText("Email"), "flow@example.com");
  await user.type(screen.getByLabelText("Password"), "test-password-123");
  vi.mocked(fetch).mockResolvedValueOnce(response({}, 201));
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("Account created. Sign in to continue.")).toBeVisible();
});
it("shows retryable connection failure rather than redirecting when bootstrap is offline", async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError("offline"));
  open();
  expect(await screen.findByRole("heading", { name: "Connection unavailable" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Retry connection" })).toBeVisible();
});
