// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthClient } from "./authClient";

const session = { accessToken: "memory-only", tokenType: "Bearer", expiresIn: 900,
  creator: { userId: "first", creatorId: "creator", fullName: "First Creator", email: "first@example.com" } };
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
describe("authentication client", () => {
  it("deduplicates initialization and keeps access tokens out of browser storage", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response()).mockResolvedValueOnce(json(session));
    vi.stubGlobal("fetch", fetcher);
    const client = new AuthClient();
    await Promise.all([client.bootstrap(), client.bootstrap()]);
    expect(fetcher.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
    expect(client.getSnapshot().status).toBe("authenticated");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
  it("distinguishes network failure from expired sessions and supports retry", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetcher);
    const client = new AuthClient();
    await client.bootstrap();
    expect(client.getSnapshot().status).toBe("error");
    fetcher.mockResolvedValueOnce(new Response()).mockResolvedValueOnce(json({}, 401));
    await client.bootstrap();
    expect(client.getSnapshot().status).toBe("anonymous");
  });
  it("retries a protected request once after 401, and never refreshes on 403", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response()).mockResolvedValueOnce(json(session));
    vi.stubGlobal("fetch", fetcher);
    const client = new AuthClient();
    await client.bootstrap();
    fetcher.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(new Response())
      .mockResolvedValueOnce(json({ ...session, accessToken: "replacement" })).mockResolvedValueOnce(json({ ok: true }));
    expect((await client.request("/api/me")).status).toBe(200);
    expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).get("Authorization")).toBe("Bearer replacement");
    fetcher.mockResolvedValueOnce(json({}, 403));
    const calls = fetcher.mock.calls.length;
    expect((await client.request("/api/me")).status).toBe(403);
    expect(fetcher.mock.calls.length).toBe(calls + 1);
  });
  it("does not claim successful logout when the server is unreachable", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response()).mockResolvedValueOnce(json(session));
    vi.stubGlobal("fetch", fetcher);
    const client = new AuthClient(); await client.bootstrap();
    fetcher.mockRejectedValueOnce(new TypeError("offline"));
    await expect(client.logout()).rejects.toThrow();
    expect(client.getSnapshot().status).toBe("authenticated");
    expect(client.getSnapshot().error).toMatch(/sign out/i);
    fetcher.mockResolvedValueOnce(new Response()).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await client.logout();
    expect(client.getSnapshot().status).toBe("anonymous");
  });
  it("ignores retried API responses after logout", async () => {
    let finishRetry: ((response: Response) => void) | undefined;
    const fetcher = vi.fn().mockResolvedValueOnce(new Response()).mockResolvedValueOnce(json(session));
    vi.stubGlobal("fetch", fetcher);
    const client = new AuthClient(); await client.bootstrap();
    fetcher.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(new Response()).mockResolvedValueOnce(json(session))
      .mockImplementationOnce(() => new Promise<Response>(resolve => { finishRetry = resolve; }));
    const pending = client.request("/api/me");
    await vi.waitFor(() => expect(finishRetry).toBeDefined());
    fetcher.mockResolvedValueOnce(new Response()).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await client.logout();
    finishRetry!(json({ private: "old-account" }));
    await expect(pending).rejects.toThrow(/session changed/i);
  });
  it("waits for pending login before server logout and rejects overlapping logins", async () => {
    let finishLogin: ((response: Response) => void) | undefined;
    const paths: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (path: string) => {
      paths.push(path);
      if (path.endsWith("csrf")) return new Response();
      if (path.endsWith("login")) return new Promise<Response>(resolve => { finishLogin = resolve; });
      return new Response(null, { status: 204 });
    }));
    const client = new AuthClient();
    const login = client.login("first@example.com", "test-password-123");
    const loginFailure = expect(login).rejects.toThrow(/session changed/i);
    await vi.waitFor(() => expect(finishLogin).toBeDefined());
    await expect(client.login("second@example.com", "test-password-123")).rejects.toThrow(/in progress/i);
    const logout = client.logout();
    expect(paths).not.toContain("/api/auth/logout");
    finishLogin!(json(session));
    await loginFailure; await logout;
    expect(paths.at(-1)).toBe("/api/auth/logout");
    expect(client.getSnapshot().status).toBe("anonymous");
  });
});
