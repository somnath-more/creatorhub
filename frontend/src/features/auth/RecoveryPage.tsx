import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { recoveryRequest } from "./recoveryApi";
import { useAuth } from "./authContext";

export function RecoveryPage({ mode }: { mode: "forgot-password" | "reset-password" | "verify-email" }) {
  const { client } = useAuth();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search); }, []);
  const forgot = mode === "forgot-password";
  const reset = mode === "reset-password";
  const missing = !forgot && !/^[A-Za-z0-9_-]{43}$/.test(token);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (forgot && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    if (reset && (password.length < 12 || new TextEncoder().encode(password).length > 72)) { setError("Use at least 12 characters and at most 72 UTF-8 bytes."); return; }
    if (reset && password !== confirmation) { setError("Passwords must match."); return; }
    setBusy(true);
    try {
      await recoveryRequest(mode, forgot ? { email: email.trim().toLowerCase() } : reset ? { token, password } : { token });
      setSuccess(forgot ? "If eligible, an email will be sent. Check your inbox and spam folder." : reset ? "Password updated. Sign in with your new password." : "Email verified. You can return to your workspace.");
      setPassword(""); setConfirmation("");
      if (reset) client.clearLocalSession();
      if (!forgot && !reset) await client.refreshProfile().catch(() => {});
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const field = "mt-2 block min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2";
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <section className="w-full max-w-md space-y-5 rounded-3xl border bg-white p-6 sm:p-9">
      <h1 className="text-2xl font-bold">{forgot ? "Forgot password" : reset ? "Reset password" : "Verify your email"}</h1>
      <p className="text-sm text-slate-600">{forgot ? "Enter your account email to request a reset link." : reset ? "Choose a new password. All existing sessions will be signed out." : "Confirm below to verify your email address. This is separate from identity verification."}</p>
      {missing ? <p role="alert">This link is missing or invalid. Request a new link.</p> : success ? <p role="status" className="text-emerald-800">{success}</p> : <form onSubmit={submit} noValidate className="space-y-4">
        {forgot && <label className="block">Email<input className={field} type="email" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>}
        {reset && <><label className="block">New password<input className={field} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block">Confirm password<input className={field} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label></>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <Button type="submit" variant="primary" disabled={busy}>{busy ? "Please wait..." : forgot ? "Send reset link" : reset ? "Update password" : "Verify email"}</Button>
      </form>}
      <div className="flex flex-wrap gap-4 text-sm text-violet-700 underline"><Link to="/login">Sign in</Link><Link to="/forgot-password">Request reset link</Link><Link to="/">Return to workspace</Link></div>
    </section>
  </main>;
}
