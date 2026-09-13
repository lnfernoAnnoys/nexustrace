import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderLock,
  Share2,
  Users,
  Phone,
  Car,
  Building2,
  MapPin,
  Landmark,
  Sparkles,
  UploadCloud,
  FileText,
  ChevronDown,
  ShieldHalf,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/context/UserProfileContext";

const entityLinks = [
  { to: "/entities/person", label: "People", icon: Users },
  { to: "/entities/phone", label: "Phone Numbers", icon: Phone },
  { to: "/entities/vehicle", label: "Vehicles", icon: Car },
  { to: "/entities/organization", label: "Organizations", icon: Building2 },
  { to: "/entities/location", label: "Locations", icon: MapPin },
  { to: "/entities/financial_account", label: "Financial Accounts", icon: Landmark },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(true);
  const location = useLocation();
  const entitiesActive = location.pathname.startsWith("/entities");
  const { profile, initials } = useUserProfile();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-bg-elevated transition-[width] duration-200",
        collapsed ? "w-[64px]" : "w-[248px]",
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border px-3">
        {!collapsed ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 border border-cyan-500/30">
                <ShieldHalf size={15} className="text-cyan-400" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-semibold tracking-wide text-text">NexusTrace</p>
                <p className="truncate text-[10px] text-text-muted">Criminal Network Analysis</p>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-panel-hover hover:text-text-secondary"
            >
              <PanelLeftClose size={15} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="mx-auto flex size-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-panel-hover hover:text-text-secondary"
          >
            <PanelLeftOpen size={15} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Command Center" collapsed={collapsed} />
        <NavItem to="/cases" icon={FolderLock} label="Cases" collapsed={collapsed} />
        <NavItem to="/network" icon={Share2} label="Network Explorer" collapsed={collapsed} />

        <div className="mt-1">
          <button
            onClick={() => setEntitiesOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
              entitiesActive ? "text-cyan-300" : "text-text-secondary hover:bg-panel-hover hover:text-text",
            )}
          >
            <Users size={16} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Entities</span>
                <ChevronDown size={13} className={cn("transition-transform", entitiesOpen && "rotate-180")} />
              </>
            )}
          </button>
          {!collapsed && entitiesOpen && (
            <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
              {entityLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                      isActive ? "bg-cyan-500/10 text-cyan-300" : "text-text-secondary hover:bg-panel-hover hover:text-text",
                    )
                  }
                >
                  <l.icon size={13} />
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="my-2 h-px bg-border" />

        <NavItem to="/ai-insights" icon={Sparkles} label="AI Insights" collapsed={collapsed} />
        <NavItem to="/evidence" icon={UploadCloud} label="Evidence Intake" collapsed={collapsed} />
        <NavItem to="/reports" icon={FileText} label="Reports" collapsed={collapsed} />
      </nav>

      <div className="border-t border-border p-2.5">
        <div className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5", !collapsed && "hover:bg-panel-hover")}>
          <Link
            to="/settings"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-panel-hover text-[11px] font-semibold text-cyan-300"
            title="Settings"
          >
            {initials}
          </Link>
          {!collapsed && (
            <Link to="/settings" className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-medium text-text">{profile.name}</p>
              <p className="truncate text-[10px] text-text-muted">{profile.badge} · {profile.department}</p>
            </Link>
          )}
          {!collapsed && (
            <Link to="/settings" title="Settings" className="shrink-0 text-text-muted transition-colors hover:text-cyan-300">
              <SettingsIcon size={14} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors mb-0.5",
          isActive
            ? "bg-cyan-500/10 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
            : "text-text-secondary hover:bg-panel-hover hover:text-text",
        )
      }
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}
