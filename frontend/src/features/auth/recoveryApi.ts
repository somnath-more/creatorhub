export async function recoveryRequest(action: "forgot-password" | "reset-password" | "verify-email", body: object) {
  const response = await fetch(`/api/auth/${action}`, { method: "POST", credentials: "omit", cache: "no-store",
    referrerPolicy: "no-referrer", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) {
    throw new Error(response.status === 400 ? "This link is invalid or expired. Request a new link." : "Could not connect. Please try again.");
  }
}
