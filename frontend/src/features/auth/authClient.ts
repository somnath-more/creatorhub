import { z } from "zod";
import { setAccountScope } from "./accountScope";

const sessionSchema = z.object({
  accessToken: z.string().min(1), tokenType: z.literal("Bearer"), expiresIn: z.number().positive(),
  creator: z.object({ userId: z.string().min(1), creatorId: z.string().min(1), fullName: z.string(), email: z.string(), emailVerified: z.boolean().default(false) }),
});
export type AuthSession = z.infer<typeof sessionSchema>;
export type AuthState = { status: "initializing" | "authenticated" | "anonymous" | "error" | "signingOut";
  session: AuthSession | null; error?: string };
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code; }
}
async function failure(response: Response): Promise<never> {
  let message = "The request could not be completed. Please try again.";
  try { const body = await response.json(); if (typeof body.detail === "string") message = body.detail; } catch { /* generic error */ }
  throw new ApiError(message, response.status);
}
export class AuthClient {
  clearLocalSession() { ++this.generation; this.publish({ status: "anonymous", session: null }); }
  async refreshProfile() {
    if (!this.state.session) return;
    const generation = this.generation;
    const response = await this.request("/api/me");
    if (!response.ok) await failure(response);
    const creator = sessionSchema.shape.creator.parse(await response.json());
    if (generation === this.generation && this.state.session) this.publish({ status: "authenticated", session: { ...this.state.session, creator } });
  }
  private state: AuthState = { status: "initializing", session: null };
  private listeners = new Set<() => void>();
  private refreshPending: Promise<AuthSession | null> | null = null;
  private bootstrapPending: Promise<void> | null = null;
  private loginPending: Promise<void> | null = null;
  private generation = 0;
  private stopping = false;
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(state: AuthState) {
    this.state = state;
    setAccountScope(state.session?.creator.userId ?? null);
    this.listeners.forEach(listener => listener());
  }
  private async csrf() {
    const response = await fetch("/api/auth/csrf", { credentials: "include", cache: "no-store" });
    if (!response.ok) await failure(response);
    return decodeURIComponent(document.cookie.split("; ").find(cookie => cookie.startsWith("XSRF-TOKEN="))?.slice(11) ?? "");
  }
  private async cookiePost(path: string, body?: unknown) {
    const csrf = await this.csrf();
    return fetch(path, { method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": csrf },
      body: body === undefined ? undefined : JSON.stringify(body) });
  }
  bootstrap = (): Promise<void> => {
    if (this.bootstrapPending) return this.bootstrapPending;
    if (this.state.status === "authenticated" || this.state.status === "anonymous") return Promise.resolve();
    this.publish({ status: "initializing", session: null });
    this.bootstrapPending = this.refresh().then(() => {}).catch(() => {
      if (!this.stopping) this.publish({ status: "error", session: null, error: "We could not connect to CreatorHub. Check your connection and try again." });
    }).finally(() => { this.bootstrapPending = null; });
    return this.bootstrapPending;
  };
  refresh(): Promise<AuthSession | null> {
    if (this.stopping) return Promise.reject(new Error("Sign out is in progress."));
    if (this.loginPending) return this.loginPending.then(() => this.state.session);
    if (this.refreshPending) return this.refreshPending;
    const generation = this.generation;
    this.refreshPending = (async () => {
      const response = await this.cookiePost("/api/auth/refresh");
      if (generation !== this.generation) return null;
      if (response.status === 401) { this.publish({ status: "anonymous", session: null }); return null; }
      if (!response.ok) await failure(response);
      const session = sessionSchema.parse(await response.json());
      if (generation !== this.generation) return null;
      this.publish({ status: "authenticated", session });
      return session;
    })().finally(() => { this.refreshPending = null; });
    return this.refreshPending;
  }
  login(email: string, password: string): Promise<void> {
    if (this.stopping || this.loginPending) return Promise.reject(new Error("An authentication operation is in progress."));
    const generation = ++this.generation;
    this.loginPending = (async () => {
      await this.refreshPending?.catch(() => {});
      if (generation !== this.generation || this.stopping) throw new Error("Your session changed. Please try again.");
      const response = await this.cookiePost("/api/auth/login", { email, password });
      if (!response.ok) await failure(response);
      const session = sessionSchema.parse(await response.json());
      if (generation !== this.generation) throw new Error("Your session changed. Please try again.");
      this.publish({ status: "authenticated", session });
    })().finally(() => { this.loginPending = null; });
    return this.loginPending;
  }
  async register(fullName: string, email: string, password: string) {
    const response = await fetch("/api/auth/register", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, email, password }) });
    if (!response.ok) await failure(response);
  }
  logout = async () => {
    if (this.stopping) return;
    this.stopping = true;
    ++this.generation;
    const session = this.state.session;
    this.publish({ status: "signingOut", session });
    try {
      // A pending response may rotate the cookie even though its state result is
      // ignored. Wait before revoking so logout uses the latest browser cookie.
      await this.refreshPending?.catch(() => {});
      await this.loginPending?.catch(() => {});
      const response = await this.cookiePost("/api/auth/logout");
      if (!response.ok) await failure(response);
      this.publish({ status: "anonymous", session: null });
    } catch (error) {
      this.publish({ status: session ? "authenticated" : "error", session,
        error: "We could not sign out on the server. Check your connection and retry sign out." });
      throw error;
    } finally { this.stopping = false; }
  };
  async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (!path.startsWith("/api/") || path.startsWith("/api/auth/")) throw new Error("Use the authentication methods for auth requests.");
    if (this.stopping) throw new Error("Sign out is in progress.");
    const generation = this.generation;
    const send = (session: AuthSession | null) => {
      if (generation !== this.generation || this.stopping) throw new Error("Your session changed. Please try again.");
      const headers = new Headers(init.headers);
      if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
      return fetch(path, { ...init, headers, credentials: "include", cache: "no-store" });
    };
    const response = await send(this.state.session);
    if (generation !== this.generation || this.stopping) throw new Error("Your session changed. Please try again.");
    if (response.status !== 401) return response;
    const session = await this.refresh();
    if (!session) return response;
    const retried = await send(session);
    if (generation !== this.generation || this.stopping) throw new Error("Your session changed. Please try again.");
    return retried;
  }
}
export const authClient = new AuthClient();
