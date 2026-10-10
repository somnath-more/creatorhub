import { useState } from "react";
import { Menu, Play, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { PortalNavigation } from "../components/molecules/PortalNavigation";
import { useAuth } from "../features/auth/authContext";

function Brand() {
  return (
    <Link
      to="/"
      aria-label="CreatorHub home"
      className="inline-flex min-h-11 items-center gap-2.5 text-xl font-bold tracking-tight"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white">
        <Play size={18} fill="currentColor" aria-hidden="true" />
      </span>
      CreatorHub<span className="text-violet-600">.</span>
    </Link>
  );
}

export function PortalLayout() {
  const { state, client } = useAuth();
  const location = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === location.pathname;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <p className="mb-3 mt-12 px-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Creator portal
        </p>
        <PortalNavigation label="Main navigation" />
        <div className="mt-auto rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold">Your next chapter starts here</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            A home for your content, community, and creative business.
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-8">
            <div className="lg:hidden">
              <Brand />
            </div>
            <p className="hidden text-sm font-medium text-slate-500 lg:block">
              Your creator workspace
            </p>
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
              <span className="hidden max-w-48 truncate text-sm font-semibold sm:block">{state.session?.creator.fullName}</span>
              <Button disabled={state.status === "signingOut"} onClick={() => void client.logout().catch(() => {})}>{state.status === "signingOut" ? "Signing out…" : "Sign out"}</Button>
            </div>
            <Button
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setOpenPath(menuOpen ? null : location.pathname)}
              className="px-3 lg:hidden"
            >
              {menuOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </Button>
          </div>
          {menuOpen && (
            <div className="border-t border-slate-100 p-4 lg:hidden">
              <PortalNavigation
                id="mobile-navigation"
                label="Mobile navigation"
                onNavigate={() => setOpenPath(null)}
              />
            </div>
          )}
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10"
        >
          <p className="mb-4 text-xs leading-5 text-slate-500">Content, uploads, verification and sales currently use account-scoped browser demo data.</p>
          {state.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
