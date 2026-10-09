import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  heading: string;
  message: string;
  action?: { to: string; label: string };
};

export function WorkspacePlaceholder({
  title,
  description,
  icon: Icon,
  heading,
  message,
  action,
}: Props) {
  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
        Your workspace
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
        {description}
      </p>
      <section
        className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center"
        aria-label={heading}
      >
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Icon size={26} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
          {message}
        </p>
        {action && (
          <Link
            to={action.to}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            {action.label}
          </Link>
        )}
      </section>
    </>
  );
}
