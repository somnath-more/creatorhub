import { useState } from "react";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "./authContext";

export function EmailVerificationBanner() {
  const { state, client } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (state.session?.creator.emailVerified) return null;
  async function send() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await client.request("/api/account/email-verification/resend", { method: "POST" });
      if (!response.ok) throw new Error("Could not send the email. Please try again.");
      setMessage("If eligible, an email will be sent. Check your inbox and spam folder. Wait 60 seconds before requesting again.");
    } catch { setError("Could not send the email. Please try again."); }
    finally { setBusy(false); }
  }
  return <aside aria-label="Email verification" className="mb-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
    <p>Verify your email address. You can continue using your workspace while verification is pending.</p>
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void send()}>{busy ? "Sending..." : "Resend verification email"}</Button><Button disabled={busy} onClick={() => void client.refreshProfile().catch(() => setError("Could not refresh your account. Try again."))}>I've verified my email</Button></div>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </aside>;
}
