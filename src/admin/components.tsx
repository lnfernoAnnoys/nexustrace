import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Ban, Download, ExternalLink, FileText, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LevelBadge } from "@/components/shared/LevelPips";
import { ACCESS_LEVELS, formatBytes, levelTone, type RequestFile } from "@/lib/access";
import { cn, formatDateTime } from "@/lib/utils";
import { adminApi, errorText, fileUrl } from "./adminApi";
import type { AccountStatus, AdminUser, AuditEntry } from "./types";

export const when = (ms: number) => formatDateTime(new Date(ms).toISOString());

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const text = name.replace(/^Insp\.?\s*/i, "").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-border-strong bg-panel-hover text-[11px] font-semibold text-cyan-300",
        className,
      )}
    >
      {text}
    </span>
  );
}

const PICKER_ON = {
  blue: "border-blue/60 bg-blue/15 text-blue",
  cyan: "border-cyan/60 bg-cyan/15 text-cyan",
  amber: "border-amber/60 bg-amber/15 text-amber",
  red: "border-red/60 bg-red/15 text-red",
} as const;

/** Eight buttons, 1 to 8. Levels below `min` can't be chosen. */
export function LevelPicker({
  value,
  onChange,
  min = 1,
  marked,
}: {
  value: number;
  onChange: (level: number) => void;
  min?: number;
  /** a level to label, e.g. the one the person asked for */
  marked?: { level: number; label: string };
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Access level">
      {ACCESS_LEVELS.map((n) => {
        const disabled = n < min;
        const on = n === value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              "mono relative flex h-11 flex-col items-center justify-center rounded-md border text-sm font-semibold transition-colors",
              on ? PICKER_ON[levelTone(n)] : "border-border text-text-secondary hover:border-border-strong hover:bg-panel-hover",
              disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
            )}
          >
            {n}
            {marked?.level === n && (
              <span className="absolute -bottom-[7px] rounded bg-panel px-1 text-[8px] font-medium uppercase tracking-wide text-text-muted">
                {marked.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Confirms and applies a manual level change, with an optional note that goes in the audit log. */
export function ChangeLevelDialog({
  user,
  level,
  onClose,
  onChanged,
}: {
  user: AdminUser;
  level: number;
  onClose: () => void;
  onChanged: (user: AdminUser) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminApi<{ user: AdminUser }>(`/users/${user.id}/access`, { method: "PATCH", body: { level, note } });
      onChanged(res.user);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  const raising = level > user.accessLevel;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{raising ? "Raise" : "Lower"} access level</DialogTitle>
          <DialogDescription>
            {user.name} ({user.username}) will {raising ? "gain" : "lose"} access straight away.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-3 rounded-md border border-border bg-panel-hover/30 py-3">
            <LevelBadge level={user.accessLevel} />
            <ArrowRight size={14} className="text-text-muted" />
            <LevelBadge level={level} />
          </div>
          <div>
            <Label className="mb-1.5 block">Note (optional, kept in the audit log)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Approved by the Director" autoFocus />
          </div>
          {error && (
            <p role="alert" className="text-xs text-red">
              {error}
            </p>
          )}
          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : `Set level ${level}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The identity documents attached to a request: images are previewed, PDFs are opened or downloaded. */
export function DocumentGrid({
  files,
  urlFor = (fileId, download) => fileUrl(0, fileId, download),
}: {
  files: RequestFile[];
  /** Builds the URL for one file. Defaults to an access-request's own file route; sign-up documents pass their own. */
  urlFor?: (fileId: number, download?: boolean) => string;
}) {
  if (files.length === 0) return <p className="text-xs text-text-muted">No documents attached.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {files.map((f) => (
        <div key={f.id} className="overflow-hidden rounded-md border border-border bg-panel-hover/30">
          {f.type.startsWith("image/") ? (
            <a href={urlFor(f.id)} target="_blank" rel="noreferrer" title="Open full size">
              <img src={urlFor(f.id)} alt={f.name} className="h-44 w-full bg-black/30 object-contain" />
            </a>
          ) : (
            <div className="flex h-44 items-center justify-center bg-black/20">
              <FileText size={40} className="text-text-muted" />
            </div>
          )}
          <div className="flex items-center gap-2 px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-text" title={f.name}>
                {f.name}
              </p>
              <p className="text-[10px] text-text-muted">
                {f.type === "application/pdf" ? "PDF" : f.type === "image/png" ? "PNG" : "JPEG"} · {formatBytes(f.size)}
              </p>
            </div>
            <a
              href={urlFor(f.id)}
              target="_blank"
              rel="noreferrer"
              className="text-text-muted hover:text-cyan-300"
              title="Open in a new tab"
              aria-label={`Open ${f.name}`}
            >
              <ExternalLink size={14} />
            </a>
            <a
              href={urlFor(f.id, true)}
              className="text-text-muted hover:text-cyan-300"
              title="Download"
              aria-label={`Download ${f.name}`}
            >
              <Download size={14} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

/** One line describing an audit-log entry. */
export function describeAudit(e: AuditEntry): ReactNode {
  const d = e.detail as { from?: number; to?: number; requested?: number; requestId?: number; username?: string };
  const person = e.targetId ? (
    <Link to={`/accounts/${e.targetId}`} className="text-cyan-300 hover:text-cyan-200">
      {e.targetName}
    </Link>
  ) : (
    e.targetName
  );
  switch (e.action) {
    case "level_changed":
      return (
        <>
          Set {person} to level {d.to} (was {d.from})
        </>
      );
    case "request_approved":
      return (
        <>
          Approved <Link to={`/requests/${d.requestId}`} className="text-cyan-300 hover:text-cyan-200">request #{d.requestId}</Link> from{" "}
          {person}: level {d.from} → {d.to}
          {d.requested !== d.to && <span className="text-text-muted"> (asked for {d.requested})</span>}
        </>
      );
    case "request_denied":
      return (
        <>
          Denied <Link to={`/requests/${d.requestId}`} className="text-cyan-300 hover:text-cyan-200">request #{d.requestId}</Link> from{" "}
          {person} <span className="text-text-muted">(asked for level {d.requested})</span>
        </>
      );
    case "role_changed":
      return (
        <>
          Changed {person} from {String(d.from)} to {String(d.to)}
        </>
      );
    case "signup_approved":
      return <>Approved {person}'s sign-up</>;
    case "signup_denied":
      return <>Denied {person}'s sign-up</>;
    case "account_banned":
      return <>Banned {person}</>;
    case "account_unbanned":
      return <>Lifted the ban on {person}</>;
    case "account_deleted":
      return <>Deleted the account {String(d.username ?? e.targetName)}</>;
    case "identity_changed":
      return <>Edited {person}'s profile</>;
  }
}

const STATUS_BADGE: Record<AccountStatus, { label: string; variant: "green" | "amber" | "red" }> = {
  active: { label: "Active", variant: "green" },
  pending_approval: { label: "Pending approval", variant: "amber" },
  banned: { label: "Banned", variant: "red" },
};

export function StatusBadge({ status }: { status: AccountStatus }) {
  const s = STATUS_BADGE[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Suspends or lifts a suspension. Suspending ends every session the account currently holds. */
export function BanDialog({
  user,
  onClose,
  onChanged,
}: {
  user: AdminUser;
  onClose: () => void;
  onChanged: (user: AdminUser) => void;
}) {
  const banning = user.status !== "banned";
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminApi<{ user: AdminUser }>(`/users/${user.id}/${banning ? "ban" : "unban"}`, {
        method: "POST",
        body: banning ? { reason } : undefined,
      });
      onChanged(res.user);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{banning ? "Suspend" : "Lift suspension on"} {user.name}</DialogTitle>
          <DialogDescription>
            {banning
              ? "They will be signed out everywhere and can't sign in again until you lift this. Nothing of theirs is deleted."
              : "They will be able to sign in again."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {banning && (
            <div>
              <Label className="mb-1.5 block">Reason (kept in the audit log)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} autoFocus placeholder="e.g. Left the department" />
            </div>
          )}
          {error && (
            <p role="alert" className="text-xs text-red">
              {error}
            </p>
          )}
          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant={banning ? "destructive" : "default"} disabled={busy || (banning && reason.trim().length < 3)}>
              {banning ? <Ban size={14} /> : <ShieldCheck size={14} />} {busy ? "Working…" : banning ? "Suspend account" : "Lift suspension"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Permanently removes an account and everything tied to it. They could sign up again afterwards. */
export function DeleteAccountDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUser;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminApi(`/users/${user.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-red">
            <AlertTriangle size={16} /> Delete {user.name}'s account
          </DialogTitle>
          <DialogDescription>
            This permanently removes their profile, sessions, backup codes and access requests. This can't be undone —
            though they could sign up again afterwards with the same details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <Label className="mb-1.5 block">
              Type <span className="mono text-text">{user.username}</span> to confirm
            </Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus autoComplete="off" />
          </div>
          {error && (
            <p role="alert" className="text-xs text-red">
              {error}
            </p>
          )}
          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={busy || confirmText !== user.username}>
              <Trash2 size={14} /> {busy ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** An administrator correcting someone's name, badge, department or position. */
export function EditIdentityDialog({
  user,
  onClose,
  onChanged,
}: {
  user: AdminUser;
  onClose: () => void;
  onChanged: (user: AdminUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [badge, setBadge] = useState(user.badge);
  const [department, setDepartment] = useState(user.department);
  const [position, setPosition] = useState(user.position);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminApi<{ user: AdminUser }>(`/users/${user.id}/identity`, {
        method: "PATCH",
        body: { name, badge, department, position },
      });
      onChanged(res.user);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.name}'s profile</DialogTitle>
          <DialogDescription>Their email and password stay theirs to change, in their own Settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <Label className="mb-1.5 block">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Badge / ID</Label>
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Position / rank</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          {error && (
            <p role="alert" className="text-xs text-red">
              {error}
            </p>
          )}
          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
