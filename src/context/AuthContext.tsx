import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { clearDataset } from "@/data/loader";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  badge: string;
  department: string;
  position: string;
  email: string;
  role: "user" | "admin";
  accessLevel: number;
  status: "pending_approval" | "active" | "banned";
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
}

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    api<{ user: AuthUser }>("/auth/me")
      .then(({ user }) => {
        if (cancelled) return;
        setUserState(user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      clearDataset();
      setUser(null);
    }
  }, [setUser]);

  const value = useMemo(() => ({ user, status, setUser, logout }), [user, status, setUser, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
