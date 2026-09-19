import type { AccessRequest } from "@/lib/access";

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  badge: string;
  department: string;
  email: string;
  role: "user" | "admin";
  accessLevel: number;
  twoFactorEnabled: boolean;
  createdAt: number;
  pendingRequest: { id: number; requestedLevel: number } | null;
}

/** An access request together with who filed it. */
export interface AdminRequest extends AccessRequest {
  user: {
    id: number;
    username: string;
    name: string;
    badge: string;
    department: string;
    email: string;
    currentLevel: number;
  };
}

export type AuditAction = "level_changed" | "request_approved" | "request_denied" | "role_changed";

export interface AuditEntry {
  id: number;
  at: number;
  actorName: string;
  action: AuditAction;
  targetId: number | null;
  targetName: string;
  detail: Record<string, unknown>;
}
