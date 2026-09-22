import type { AccessRequest, RequestFile } from "@/lib/access";

export type AccountStatus = "pending_approval" | "active" | "banned";

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  badge: string;
  department: string;
  position: string;
  email: string;
  role: "user" | "admin";
  accessLevel: number;
  status: AccountStatus;
  banReason: string;
  twoFactorEnabled: boolean;
  createdAt: number;
  pendingRequest: { id: number; requestedLevel: number } | null;
}

/** A sign-up waiting for an administrator to let it in. */
export interface PendingSignup {
  id: number;
  username: string;
  name: string;
  department: string;
  position: string;
  email: string;
  createdAt: number;
  files: RequestFile[];
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

export type AuditAction =
  | "level_changed"
  | "request_approved"
  | "request_denied"
  | "role_changed"
  | "signup_approved"
  | "signup_denied"
  | "account_banned"
  | "account_unbanned"
  | "account_deleted"
  | "identity_changed";

export interface AuditEntry {
  id: number;
  at: number;
  actorName: string;
  action: AuditAction;
  targetId: number | null;
  targetName: string;
  detail: Record<string, unknown>;
}
