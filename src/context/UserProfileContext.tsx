import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth, type AuthUser } from "./AuthContext";

export interface UserProfile {
  name: string;
  badge: string;
  department: string;
  email: string;
}

export interface NotificationPrefs {
  criticalAlerts: boolean;
  highAlerts: boolean;
  mediumAlerts: boolean;
  caseUpdates: boolean;
  evidenceProcessed: boolean;
}

interface UserProfileState {
  profile: UserProfile;
  updateProfile: (p: UserProfile) => Promise<void>;
  notifications: NotificationPrefs;
  setNotifications: (n: NotificationPrefs) => void;
  initials: string;
}

const EMPTY_PROFILE: UserProfile = { name: "", badge: "", department: "", email: "" };

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  criticalAlerts: true,
  highAlerts: true,
  mediumAlerts: false,
  caseUpdates: true,
  evidenceProcessed: true,
};

const NOTIF_STORAGE_KEY = "nexustrace.notificationPrefs";

function loadNotifications(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) return { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(raw) };
  } catch {
    // ignore malformed storage, fall back to default
  }
  return DEFAULT_NOTIFICATIONS;
}

function initialsFor(name: string) {
  const parts = name.replace(/^Insp\.?\s*/i, "").trim().split(/\s+/);
  return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "IN";
}

const UserProfileCtx = createContext<UserProfileState | null>(null);

/** The profile comes from the signed-in account on the server; notification prefs stay on this device. */
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();
  const [notifications, setNotificationsState] = useState<NotificationPrefs>(loadNotifications);

  useEffect(() => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const profile: UserProfile = user
    ? { name: user.name, badge: user.badge, department: user.department, email: user.email }
    : EMPTY_PROFILE;

  async function updateProfile(next: UserProfile) {
    const res = await api<{ user: AuthUser }>("/auth/profile", { method: "PATCH", body: next });
    setUser(res.user);
  }

  return (
    <UserProfileCtx.Provider
      value={{
        profile,
        updateProfile,
        notifications,
        setNotifications: setNotificationsState,
        initials: initialsFor(profile.name),
      }}
    >
      {children}
    </UserProfileCtx.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileCtx);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
