import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Paperclip, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelPips, RequestStatusBadge } from "@/components/shared/LevelPips";
import { ChangeLevelDialog, Initials, LevelPicker, describeAudit, when } from "../components";
import { useAdminData } from "../useAdminData";
import type { AdminRequest, AdminUser, AuditEntry } from "../types";

interface AccountData {
  user: AdminUser;
  requests: AdminRequest[];
  activity: AuditEntry[];
}

export default function AccountDetail() {
  const { id } = useParams();
  const { data, error, reload } = useAdminData<AccountData>(`/users/${id}`);
  // no pick yet (or a pick made on another account) -> the picker shows the account's real level
  const [picked, setPicked] = useState<{ userId: number; level: number } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const back = (
    <Link to="/accounts" className="mb-4 flex w-fit items-center gap-1 text-xs text-text-muted hover:text-text">
      <ArrowLeft size={12} /> All accounts
    </Link>
  );

  if (!data) {
    return (
      <>
        {back}
        {error ? <p role="alert" className="text-xs text-red">{error}</p> : <p className="text-xs text-text-muted">Loading…</p>}
      </>
    );
  }

  const { user, requests, activity } = data;
  const level = picked?.userId === user.id ? picked.level : user.accessLevel;

  return (
    <>
      {back}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3">
              <Initials name={user.name} className="size-12 text-sm" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-base font-semibold text-text">
                  {user.name}
                  {user.role === "admin" && <Badge variant="purple">Admin</Badge>}
                </p>
                <p className="truncate text-xs text-text-muted">{user.username}</p>
              </div>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
              <dt className="text-text-muted">Badge</dt>
              <dd className="text-text">{user.badge || "—"}</dd>
              <dt className="text-text-muted">Department</dt>
              <dd className="text-text">{user.department || "—"}</dd>
              <dt className="text-text-muted">Email</dt>
              <dd className="truncate text-text">{user.email || "—"}</dd>
              <dt className="text-text-muted">Two-factor</dt>
              <dd className="flex items-center gap-1.5 text-text">
                {user.twoFactorEnabled ? (
                  <>
                    <ShieldCheck size={13} className="text-green" /> On
                  </>
                ) : (
                  <>
                    <ShieldOff size={13} className="text-text-muted" /> Not set up
                  </>
                )}
              </dd>
              <dt className="text-text-muted">Joined</dt>
              <dd className="text-text">{when(user.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Access level</CardTitle>
            <LevelPips level={user.accessLevel} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary">
              Currently <span className="mono font-semibold text-text">level {user.accessLevel}</span>. Pick a new level, then confirm.
            </p>
            <LevelPicker
              value={level}
              onChange={(n) => setPicked({ userId: user.id, level: n })}
              marked={user.pendingRequest ? { level: user.pendingRequest.requestedLevel, label: "asked" } : undefined}
            />
            <div className="flex items-center gap-3">
              <Button disabled={level === user.accessLevel} onClick={() => setConfirming(true)}>
                Change to level {level}
              </Button>
              {user.pendingRequest && (
                <Link to={`/requests/${user.pendingRequest.id}`} className="flex items-center gap-1 text-xs text-amber hover:opacity-80">
                  Has a request waiting <ArrowRight size={11} />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Access requests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {requests.length === 0 && <p className="py-4 text-center text-xs text-text-muted">This person hasn't requested more access.</p>}
            {requests.map((r) => (
              <Link
                key={r.id}
                to={`/requests/${r.id}`}
                className="rounded-md border border-border bg-panel-hover/30 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-panel-hover"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <RequestStatusBadge status={r.status} />
                  <span className="text-xs text-text">
                    Level {r.fromLevel} → {r.requestedLevel}
                  </span>
                  {r.grantedLevel !== null && <span className="text-xs text-green">granted {r.grantedLevel}</span>}
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-text-muted">
                    <Paperclip size={10} /> {r.files.length} · {when(r.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to this account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {activity.length === 0 && <p className="py-4 text-center text-xs text-text-muted">Nothing has been changed yet.</p>}
            {activity.map((e) => (
              <div key={e.id} className="py-2 text-xs text-text-secondary">
                <p>
                  <span className="text-text">{e.actorName}</span>: {describeAudit(e)}
                </p>
                <p className="text-[10px] text-text-muted">
                  {when(e.at)}
                  {typeof e.detail.note === "string" && e.detail.note ? ` · “${e.detail.note}”` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {confirming && (
        <ChangeLevelDialog
          user={user}
          level={level}
          onClose={() => setConfirming(false)}
          onChanged={() => {
            setConfirming(false);
            setPicked(null);
            reload();
          }}
        />
      )}
    </>
  );
}
