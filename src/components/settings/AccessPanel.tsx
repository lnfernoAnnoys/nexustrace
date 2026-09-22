import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { FileText, Lock, Paperclip, Send, Undo2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LevelBadge, LevelPips, RequestStatusBadge } from "@/components/shared/LevelPips";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import {
  ACCESS_LEVELS,
  MAX_ACCESS_LEVEL,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_MB,
  formatBytes,
  type AccessRequest,
} from "@/lib/access";
import { formatDateTime } from "@/lib/utils";
import { tr } from "@/i18n";

interface AccessData {
  level: number;
  maxLevel: number;
  requests: AccessRequest[];
}

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
const REASON_MIN = 20;
const REASON_MAX = 2000;

function errorText(err: unknown) {
  return err instanceof ApiError ? err.message : tr("login.generic");
}

const when = (ms: number) => formatDateTime(new Date(ms).toISOString());

export function AccessPanel() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState<AccessData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AccessData>("/access")
      .then(setData)
      .catch((err) => setError(errorText(err)));
  }, []);

  // An administrator may have changed the level since this session started; keep the rest of the app in step.
  useEffect(() => {
    if (data && user && data.level !== user.accessLevel) setUser({ ...user, accessLevel: data.level });
  }, [data, user, setUser]);

  if (!data) {
    return error ? (
      <p role="alert" className="text-xs text-red">
        {error}
      </p>
    ) : (
      <p className="text-xs text-text-muted">{tr("common.loading")}</p>
    );
  }

  const pending = data.requests.find((r) => r.status === "pending");

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{tr("acc.yourLevel")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="mono flex size-16 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-panel-hover text-3xl font-semibold text-text">
            {data.level}
          </div>
          <div className="min-w-0">
            <LevelPips level={data.level} className="mb-1.5" />
            <p className="text-xs text-text-secondary">
              {tr("acc.levelOf", { n: data.level, max: data.maxLevel })}
            </p>
          </div>
        </CardContent>
      </Card>

      {pending ? (
        <PendingCard request={pending} onChange={setData} />
      ) : data.level >= MAX_ACCESS_LEVEL ? (
        <Card>
          <CardContent className="pt-4 text-xs text-text-secondary">{tr("acc.highest")}</CardContent>
        </Card>
      ) : (
        <RequestForm currentLevel={data.level} onSent={setData} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tr("acc.history")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.requests.length === 0 && <p className="text-xs text-text-muted">{tr("acc.noRequests")}</p>}
          {data.requests.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-panel-hover/30 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <RequestStatusBadge status={r.status} />
                <span className="text-xs text-text">
                  {tr("acc.fromTo", { from: r.fromLevel, to: r.requestedLevel })}
                </span>
                {r.status === "approved" && r.grantedLevel !== null && (
                  <span className="text-xs text-green">{tr("acc.granted", { n: r.grantedLevel })}</span>
                )}
                <span className="ml-auto text-[10px] text-text-muted">{when(r.createdAt)}</span>
              </div>
              {r.decisionNote && (
                <p className="mt-1.5 text-[11px] text-text-secondary">
                  <span className="text-text-muted">{r.decidedBy || tr("acc.administrator")}:</span> {r.decisionNote}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PendingCard({ request, onChange }: { request: AccessRequest; onChange: (d: AccessData) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function withdraw() {
    setBusy(true);
    setError("");
    try {
      onChange(await api<AccessData>(`/access/requests/${request.id}`, { method: "DELETE" }));
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Card className="border-amber/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tr("acc.underReview")} <LevelBadge level={request.requestedLevel} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary">
          {tr("acc.sent", { when: when(request.createdAt) })}
        </p>
        <p className="whitespace-pre-wrap rounded-md border border-border bg-panel-hover/30 px-3 py-2 text-xs text-text">{request.reason}</p>
        <div className="flex flex-wrap gap-1.5">
          {request.files.map((f) => (
            <span key={f.id} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary">
              <Paperclip size={11} /> {f.name}
            </span>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-xs text-red">
            {error}
          </p>
        )}
        <Button variant="outline" size="sm" className="w-fit" disabled={busy} onClick={withdraw}>
          <Undo2 size={13} /> {busy ? tr("acc.withdrawing") : tr("acc.withdraw")}
        </Button>
      </CardContent>
    </Card>
  );
}

function RequestForm({ currentLevel, onSent }: { currentLevel: number; onSent: (d: AccessData) => void }) {
  const higher = ACCESS_LEVELS.filter((n) => n > currentLevel);
  const [level, setLevel] = useState(String(higher[0]));
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function addFiles(incoming: File[]) {
    const next = [...files];
    let problem = "";
    for (const f of incoming) {
      if (next.length >= MAX_UPLOAD_FILES) {
        problem = tr("acc.errMax", { n: MAX_UPLOAD_FILES });
        break;
      }
      if (!/\.(pdf|png|jpe?g)$/i.test(f.name)) {
        problem = tr("acc.errType", { name: f.name });
        continue;
      }
      if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
        problem = tr("acc.errSize", { name: f.name, mb: MAX_UPLOAD_MB });
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    setError(problem);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles([...e.dataTransfer.files]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("requestedLevel", level);
      form.append("reason", reason);
      for (const f of files) form.append("files", f);
      onSent(await api<AccessData>("/access/requests", { method: "POST", body: form }));
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  const ready = reason.trim().length >= REASON_MIN && files.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr("acc.requestTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <Label className="mb-1.5 block">{tr("acc.askLevel")}</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-9 w-40 text-sm" aria-label={tr("acc.askLevel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {higher.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {tr("acc.level", { n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-text-muted">{tr("acc.mayDiffer")}</p>
          </div>

          <div>
            <Label className="mb-1.5 block">{tr("acc.why")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={REASON_MAX}
              rows={5}
              placeholder={tr("acc.whyPh")}
            />
            <p className="mt-1 text-[11px] text-text-muted">
              {reason.trim().length < REASON_MIN
                ? tr("acc.atLeast", { min: REASON_MIN, n: reason.trim().length })
                : `${reason.length} / ${REASON_MAX}`}
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block">{tr("acc.proof")}</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center gap-1 rounded-md border border-dashed px-4 py-5 text-center transition-colors ${
                dragging ? "border-cyan-400 bg-cyan-500/10" : "border-border-strong"
              }`}
            >
              <Paperclip size={16} className="text-text-muted" />
              <p className="text-xs text-text-secondary">
                {tr("acc.drop")}{" "}
                <button type="button" onClick={() => picker.current?.click()} className="text-cyan-300 hover:text-cyan-200">
                  {tr("acc.browse")}
                </button>
              </p>
              <p className="text-[11px] text-text-muted">
                {tr("acc.fileRules", { n: MAX_UPLOAD_FILES, mb: MAX_UPLOAD_MB })}
              </p>
              <input
                ref={picker}
                type="file"
                accept={ACCEPTED}
                multiple
                hidden
                onChange={(e) => {
                  addFiles([...(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-border bg-panel-hover/30 px-2.5 py-1.5">
                    <FileText size={14} className="shrink-0 text-text-muted" />
                    <span className="min-w-0 flex-1 truncate text-xs text-text">{f.name}</span>
                    <span className="text-[10px] text-text-muted">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                      aria-label={tr("acc.remove", { name: f.name })}
                      className="text-text-muted hover:text-red"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-text-muted">
              <Lock size={10} /> {tr("acc.encrypted")}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red">
              {error}
            </p>
          )}
          <Button type="submit" className="w-fit" disabled={busy || !ready}>
            <Send size={14} /> {busy ? tr("acc.sending") : tr("acc.send")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
