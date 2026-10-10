import { authClient, ApiError } from "./authClient";
export async function apiRequest(path: string, init: RequestInit = {}) {
  const response = await authClient.request(path, init);
  if (!response.ok) {
    let message = "The request could not be completed. Please try again.";
    let code: string | undefined;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        if ("detail" in body && typeof body.detail === "string") message = body.detail;
        if ("code" in body && typeof body.code === "string") code = body.code;
      }
    } catch { /* Safe fallback for non-JSON proxy failures. */ }
    throw new ApiError(message,response.status,code);
  }
  return response;
}
export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
