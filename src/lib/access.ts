export const MAX_ACCESS_LEVEL = 8;
export const ACCESS_LEVELS = Array.from({ length: MAX_ACCESS_LEVEL }, (_, i) => i + 1);

export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_FILES = 3;

export type RequestStatus = "pending" | "approved" | "denied" | "cancelled";

export interface RequestFile {
  id: number;
  name: string;
  type: "application/pdf" | "image/png" | "image/jpeg";
  size: number;
}

/** An access request as the person who filed it sees it. */
export interface AccessRequest {
  id: number;
  status: RequestStatus;
  fromLevel: number;
  requestedLevel: number;
  grantedLevel: number | null;
  reason: string;
  decisionNote: string;
  decidedBy: string;
  createdAt: number;
  decidedAt: number | null;
  files: RequestFile[];
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Under review",
  approved: "Approved",
  denied: "Denied",
  cancelled: "Withdrawn",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Colour band for a level: the higher the level, the warmer the colour. */
export function levelTone(level: number): "blue" | "cyan" | "amber" | "red" {
  if (level <= 2) return "blue";
  if (level <= 4) return "cyan";
  if (level <= 6) return "amber";
  return "red";
}
