import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const appearance = {
    primary: "border-violet-600 bg-violet-600 text-white hover:bg-violet-700",
    secondary: "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${appearance} ${className}`}
      {...props}
    />
  );
}
