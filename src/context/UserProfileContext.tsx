import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  setProfile: (p: UserProfile) => void;
  notifications: NotificationPrefs;
  setNotifications: (n: NotificationPrefs) => void;
  initials: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Insp. A. Sharma",
  badge: "IPS-4471",
  department: "MHA Task Force",
  email: "a.sharma@mha.gov.in",
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  criticalAlerts: true,
  highAlerts: true,
  mediumAlerts: false,
  caseUpdates: true,
  evidenceProcessed: true,
};

const STORAGE_KEY = "nexustrace.userProfile";
const NOTIF_STORAGE_KEY = "nexustrace.notificationPrefs";

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    // ignore malformed storage, fall back to default
  }
  return DEFAULT_PROFILE;
}

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

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(loadProfile);
  const [notifications, setNotificationsState] = useState<NotificationPrefs>(loadNotifications);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  return (
    <UserProfileCtx.Provider
      value={{
        profile,
        setProfile: setProfileState,
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
