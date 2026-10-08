import {
  LayoutDashboard,
  ListVideo,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const destinations = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/content", label: "Content", icon: ListVideo },
  { to: "/content/new", label: "Create content", icon: PlusCircle },
  { to: "/verification", label: "Verification", icon: ShieldCheck },
];

type Props = { label: string; onNavigate?: () => void; id?: string };

export function PortalNavigation({ label, onNavigate, id }: Props) {
  return (
    <nav aria-label={label} id={id} className="space-y-1.5">
      {destinations.map(({ to, label: title, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`
          }
        >
          <Icon size={20} aria-hidden="true" />
          {title}
        </NavLink>
      ))}
    </nav>
  );
}
