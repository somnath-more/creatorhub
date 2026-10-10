import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "./authContext";
import { safeReturnPath } from "./returnPath";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const signingUp = mode === "register";
  const { state, client } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const schema = z.object({
    fullName: signingUp ? z.string().trim().min(1, "Enter your full name.").max(100, "Use 100 characters or fewer.") : z.string(),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address.")),
    password: z.string().min(signingUp ? 12 : 1, signingUp ? "Use at least 12 characters." : "Enter your password.")
      .refine(value => new TextEncoder().encode(value).length <= 72, "Use a password of 72 UTF-8 bytes or fewer."),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema), defaultValues: { fullName: "", email: location.state?.email ?? "", password: "" },
  });
  if (state.session) return <Navigate to={safeReturnPath(location.state?.from)} replace />;
  async function submit(values: z.infer<typeof schema>) {
    setError("");
    try {
      if (signingUp) {
        await client.register(values.fullName, values.email, values.password);
        navigate("/login", { replace: true, state: { email: values.email, message: "Account created. Sign in to continue." } });
      } else await client.login(values.email, values.password);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not connect. Please try again."); }
  }
  const field = "mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 aria-invalid:border-red-600";
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="auth-title">
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-xl font-bold"><Play className="text-violet-600" aria-hidden="true" />CreatorHub<span className="text-violet-600">.</span></Link>
      <h1 id="auth-title" className="text-3xl font-bold tracking-tight">{signingUp ? "Create your account" : "Sign in"}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">{signingUp ? "Start your creator workspace. You can create drafts before identity verification." : "Welcome back. Continue to your creator workspace."}</p>
      {location.state?.message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{location.state.message}</p>}
      {state.status === "initializing" && <p role="status" className="mt-4 text-sm">Restoring your session…</p>}
      {state.status === "error" && <div className="mt-4"><p role="alert" className="mb-3 text-sm text-red-700">{state.error}</p><Button onClick={() => void client.bootstrap()}>Retry connection</Button></div>}
      <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        {signingUp && <div><label htmlFor="full-name" className="text-sm font-semibold">Full name</label><input id="full-name" autoComplete="name" maxLength={100} {...register("fullName")} className={field} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "full-name-error" : undefined} />{errors.fullName && <p id="full-name-error" role="alert" className="mt-1 text-sm text-red-700">{String(errors.fullName.message)}</p>}</div>}
        <div><label htmlFor="email" className="text-sm font-semibold">Email</label><input id="email" type="email" autoComplete="email" {...register("email")} className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <p id="email-error" role="alert" className="mt-1 text-sm text-red-700">{String(errors.email.message)}</p>}</div>
        <div><label htmlFor="password" className="text-sm font-semibold">Password</label><input id="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} {...register("password")} className={field} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : signingUp ? "password-hint" : undefined} />{signingUp && <p id="password-hint" className="mt-2 text-xs leading-5 text-slate-500">At least 12 characters, up to 72 UTF-8 bytes.</p>}{errors.password && <p id="password-error" role="alert" className="mt-1 text-sm text-red-700">{String(errors.password.message)}</p>}</div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting || state.status === "initializing"}>{isSubmitting ? "Please wait…" : signingUp ? "Create account" : "Sign in"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">{signingUp ? "Already have an account? " : "New to CreatorHub? "}<Link className="font-semibold text-violet-700 underline underline-offset-4" to={signingUp ? "/login" : "/register"}>{signingUp ? "Sign in" : "Create account"}</Link></p>
    </section>
  </main>;
}
