import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Laptop, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackupCodes } from "@/components/auth/BackupCodes";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

function errorText(err: unknown) {
  return err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
}

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setMessage({ ok: false, text: "The new passwords don't match." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage({ ok: true, text: "Password updated. Your other devices were signed out." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <KeyRound size={14} className="text-cyan-400" /> Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <Label className="mb-1.5 block">Current Password</Label>
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">New Password</Label>
              <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Confirm Password</Label>
              <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-text-muted">At least 10 characters.</p>
          {message && (
            <p role="alert" className={`text-xs ${message.ok ? "text-green" : "text-red"}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" className="w-fit" disabled={busy || !current || !next || !confirm}>
            {busy ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function TwoFactorCard() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setPassword("");
    setCodes(null);
    setError("");
  }

  async function regenerate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api<{ backupCodes: string[] }>("/auth/2fa/backup-codes/regenerate", {
        method: "POST",
        body: { password },
      });
      setCodes(res.backupCodes);
      if (user) setUser({ ...user, backupCodesRemaining: res.backupCodes.length });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Shield size={14} className="text-cyan-400" /> Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-text">Authenticator app</p>
            <p className="text-[11px] text-text-muted">
              Required on every sign-in for MHA restricted-access systems. Lost your phone? An administrator can reset it.
            </p>
          </div>
          <Badge variant={user?.twoFactorEnabled ? "green" : "amber"}>{user?.twoFactorEnabled ? "Enabled" : "Not set up"}</Badge>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-panel-hover/30 px-3 py-2.5">
          <div>
            <p className="text-xs text-text">Backup codes</p>
            <p className="text-[11px] text-text-muted">{user?.backupCodesRemaining ?? 0} of 10 unused</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Regenerate
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate backup codes</DialogTitle>
            <DialogDescription>
              {codes ? "Save these somewhere safe. Your old codes no longer work." : "Confirm your password. This replaces all your existing backup codes."}
            </DialogDescription>
          </DialogHeader>
          {codes ? (
            <>
              <BackupCodes codes={codes} />
              <DialogFooter>
                <Button onClick={close}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={regenerate} className="flex flex-col gap-3">
              <Input
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder="Current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <p role="alert" className="text-xs text-red">
                  {error}
                </p>
              )}
              <DialogFooter className="mt-1">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy || !password}>
                  {busy ? "Working…" : "Generate new codes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface SessionInfo {
  id: string;
  current: boolean;
  device: string;
  ip: string;
  lastSeen: number;
}

export function SessionsCard() {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api<{ sessions: SessionInfo[] }>("/auth/sessions");
      setSessions(res.sessions);
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(id: string) {
    try {
      await api(`/auth/sessions/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {error && (
          <p role="alert" className="text-xs text-red">
            {error}
          </p>
        )}
        {sessions?.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-md border border-border bg-panel-hover/30 px-3 py-2.5">
            <Laptop size={15} className="shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text">{s.device}</p>
              <p className="text-[10px] text-text-muted">
                {s.ip} · active {timeAgo(new Date(s.lastSeen).toISOString())}
              </p>
            </div>
            {s.current ? (
              <Badge variant="green">This device</Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={() => revoke(s.id)}>
                Sign out
              </Button>
            )}
          </div>
        ))}
        {sessions === null && !error && <p className="text-xs text-text-muted">Loading…</p>}
      </CardContent>
    </Card>
  );
}
