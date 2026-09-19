import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { AuthUser } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { SESSION_ENDED_EVENT } from "./adminApi";

type Status = "loading" | "authenticated" | "anonymous";

interface AdminAuthState {
  admin: AuthUser | null;
  status: Status;
  setAdmin: (admin: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AdminAuthState | null>(null);

/** The console's own sign-in (cookie `nt_admin_session`), separate from the investigator site's. */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdminState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    api<{ user: AuthUser }>("/admin/auth/me")
      .then(({ user }) => {
        if (cancelled) return;
        setAdminState(user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAdmin = useCallback((next: AuthUser | null) => {
    setAdminState(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

  useEffect(() => {
    const onEnded = () => setAdmin(null);
    window.addEventListener(SESSION_ENDED_EVENT, onEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, onEnded);
  }, [setAdmin]);

  const logout = useCallback(async () => {
    try {
      await api("/admin/auth/logout", { method: "POST" });
    } finally {
      setAdmin(null);
    }
  }, [setAdmin]);

  const value = useMemo(() => ({ admin, status, setAdmin, logout }), [admin, status, setAdmin, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <ShieldCheck size={28} className="animate-pulse-slow text-cyan-400" />
      </div>
    );
  }
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
