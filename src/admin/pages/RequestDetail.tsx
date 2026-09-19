import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LevelBadge, RequestStatusBadge } from "@/components/shared/LevelPips";
import { MAX_ACCESS_LEVEL } from "@/lib/access";
import { adminApi, errorText } from "../adminApi";
import { usePending } from "../AdminShell";
import { DocumentGrid, Initials, LevelPicker, when } from "../components";
import { useAdminData } from "../useAdminData";
import type { AdminRequest } from "../types";

export default function RequestDetail() {
  const { id } = useParams();
  const { data, error, reload } = useAdminData<{ request: AdminRequest }>(`/requests/${id}`);
  const { refreshPending } = usePending();

  const back = (
    <Link to="/requests" className="mb-4 flex w-fit items-center gap-1 text-xs text-text-muted hover:text-text">
      <ArrowLeft size={12} /> All requests
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

  const r = data.request;
  return (
    <>
      {back}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-text">Request #{r.id}</h1>
        <RequestStatusBadge status={r.status} />
        <span className="text-xs text-text-muted">Sent {when(r.createdAt)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-4">
              <Initials name={r.user.name} className="size-11" />
              <div className="min-w-0 flex-1 basis-40">
                <Link to={`/accounts/${r.user.id}`} className="text-sm font-semibold text-text hover:text-cyan-300">
                  {r.user.name}
                </Link>
                <p className="truncate text-xs text-text-muted">
                  {[r.user.username, r.user.badge, r.user.department].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">Now</p>
                  <LevelBadge level={r.user.currentLevel} />
                </div>
                <ArrowRight size={13} className="mt-4 text-text-muted" />
                <div className="text-center">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">Asked for</p>
                  <LevelBadge level={r.requestedLevel} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">{r.reason}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity documents ({r.files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentGrid requestId={r.id} files={r.files} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {r.status === "pending" ? (
            <DecisionPanel
              request={r}
              onDecided={() => {
                reload();
                refreshPending();
              }}
            />
          ) : (
            <Outcome request={r} />
          )}
        </div>
      </div>
    </>
  );
}

function DecisionPanel({ request: r, onDecided }: { request: AdminRequest; onDecided: () => void }) {
  const min = r.user.currentLevel + 1;
  const [level, setLevel] = useState(Math.min(Math.max(r.requestedLevel, min), MAX_ACCESS_LEVEL));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");

  const cannotApprove = min > MAX_ACCESS_LEVEL;

  async function decide(decision: "approve" | "deny") {
    setBusy(decision);
    setError("");
    try {
      await adminApi(`/requests/${r.id}/decision`, {
        method: "POST",
        body: decision === "approve" ? { decision, level, note } : { decision, note },
      });
      onDecided();
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your decision</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Label className="mb-2 block">Level to grant</Label>
          <LevelPicker value={level} onChange={setLevel} min={min} marked={{ level: r.requestedLevel, label: "asked" }} />
          <p className="mt-3 text-[11px] text-text-muted">
            {cannotApprove
              ? "This person is already at the highest level."
              : level === r.requestedLevel
                ? "Granting the level they asked for."
                : `They asked for level ${r.requestedLevel}; you are granting level ${level}.`}
          </p>
        </div>

        <div>
          <Label className="mb-1.5 block">Note to the requester</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional when approving. Required when denying."
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-red">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" disabled={busy !== null || cannotApprove} onClick={() => decide("approve")}>
            <Check size={14} /> {busy === "approve" ? "Approving…" : `Approve level ${level}`}
          </Button>
          <Button variant="destructive" disabled={busy !== null || note.trim().length < 3} onClick={() => decide("deny")}>
            <X size={14} /> {busy === "deny" ? "Denying…" : "Deny"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Outcome({ request: r }: { request: AdminRequest }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outcome</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-xs">
        {r.status === "cancelled" ? (
          <p className="text-text-secondary">The requester withdrew this request{r.decidedAt ? ` on ${when(r.decidedAt)}` : ""}.</p>
        ) : (
          <>
            <p className="text-text-secondary">
              {r.status === "approved" ? (
                <>
                  Approved at <LevelBadge level={r.grantedLevel ?? r.requestedLevel} className="mx-1" />
                </>
              ) : (
                "Denied"
              )}
              {r.decidedBy && <> by <span className="text-text">{r.decidedBy}</span></>}
              {r.decidedAt && <> on {when(r.decidedAt)}</>}.
            </p>
            {r.decisionNote && (
              <p className="whitespace-pre-wrap rounded-md border border-border bg-panel-hover/30 px-3 py-2 text-text">{r.decisionNote}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
