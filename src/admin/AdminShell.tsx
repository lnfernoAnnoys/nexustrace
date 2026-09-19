import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { History, Inbox, KeySquare, LayoutDashboard, LogOut, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./AdminAuthContext";
import { adminApi } from "./adminApi";

const PENDING_POLL_MS = 30_000;

interface PendingState {
  pending: number;
  refreshPending: () => void;
}
const PendingCtx = createContext<PendingState>({ pending: 0, refreshPending: () => undefined });

/** Number of requests waiting for a decision (drives the badge). Pages call refreshPending after deciding. */
export const usePending = () => useContext(PendingCtx);

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/requests", label: "Access Requests", icon: Inbox },
  { to: "/audit", label: "Audit Log", icon: History },
];

export default function AdminShell() {
  const { admin, logout } = useAdminAuth();
  const [pending, setPending] = useState(0);

  const refreshPending = useCallback(() => {
    adminApi<{ pending: number }>("/requests?status=pending")
      .then((r) => setPending(r.pending))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshPending();
    const timer = setInterval(refreshPending, PENDING_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshPending]);

  const value = useMemo(() => ({ pending, refreshPending }), [pending, refreshPending]);
  const initials = (admin?.name ?? "").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "AD";

  return (
    <PendingCtx.Provider value={value}>
      <div className="flex h-screen bg-bg text-text">
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-border bg-bg-elevated">
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-500/15">
              <KeySquare size={15} className="text-cyan-400" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold tracking-wide">NexusTrace Command</p>
              <p className="truncate text-[10px] text-text-muted">Access Control Console</p>
            </div>
          </div>

          <nav className="flex-1 px-2 py-3">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]"
                      : "text-text-secondary hover:bg-panel-hover hover:text-text",
                  )
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {to === "/requests" && pending > 0 && (
                  <span className="mono rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber">
                    {pending}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border p-2.5">
            <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-panel-hover text-[11px] font-semibold text-cyan-300">
                {initials}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-medium">{admin?.name}</p>
                <p className="truncate text-[10px] text-text-muted">Administrator</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="shrink-0 text-text-muted transition-colors hover:text-red"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </PendingCtx.Provider>
  );
}
