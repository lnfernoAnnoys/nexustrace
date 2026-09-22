import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, errorText, signupFileUrl } from "../adminApi";
import { usePending } from "../AdminShell";
import { DocumentGrid, Initials, PageHeader, when } from "../components";
import { useAdminData } from "../useAdminData";
import type { PendingSignup } from "../types";

export default function PendingAccounts() {
  const { data, error, reload } = useAdminData<{ users: PendingSignup[] }>("/pending-signups");
  const { refreshPending } = usePending();

  function onDecided() {
    reload();
    refreshPending();
  }

  return (
    <>
      <PageHeader
        title="Pending Accounts"
        subtitle="Sign-ups waiting for approval. Nobody here can sign in until you approve them."
      />
      <div className="flex flex-col gap-3">
        {error && <p role="alert" className="text-xs text-red">{error}</p>}
        {!data && !error && <p className="text-xs text-text-muted">Loading…</p>}
        {data?.users.length === 0 && (
          <Card className="py-12 text-center text-xs text-text-muted">No sign-ups are waiting. You're all caught up.</Card>
        )}
        {data?.users.map((u) => <PendingCard key={u.id} user={u} onDecided={onDecided} />)}
      </div>
    </>
  );
}

function PendingCard({ user: u, onDecided }: { user: PendingSignup; onDecided: () => void }) {
  const [denying, setDenying] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");

  async function approve() {
    setBusy("approve");
    setError("");
    try {
      await adminApi(`/pending-signups/${u.id}/approve`, { method: "POST" });
      onDecided();
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  }

  async function deny() {
    setBusy("deny");
    setError("");
    try {
      await adminApi(`/pending-signups/${u.id}/deny`, { method: "POST", body: { note } });
      onDecided();
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <Initials name={u.name} />
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{u.name}</CardTitle>
          <p className="truncate text-[11px] text-text-muted">
            {u.username} · {[u.department, u.position].filter(Boolean).join(" · ") || "No department given"}
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-text-muted">Applied {when(u.createdAt)}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
          <dt className="text-text-muted">Email</dt>
          <dd className="col-span-3 truncate text-text">{u.email || "—"}</dd>
        </dl>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Badge / ID proof ({u.files.length})
          </p>
          <DocumentGrid files={u.files} urlFor={(fileId, dl) => signupFileUrl(u.id, fileId, dl)} />
        </div>

        {denying && (
          <div>
            <Label className="mb-1.5 block">Reason (kept in the audit log)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} autoFocus placeholder="e.g. Could not verify identity" />
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-red">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          {denying ? (
            <>
              <Button variant="outline" onClick={() => { setDenying(false); setNote(""); setError(""); }}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={busy !== null || note.trim().length < 3} onClick={deny}>
                <X size={14} /> {busy === "deny" ? "Denying…" : "Confirm deny"}
              </Button>
            </>
          ) : (
            <>
              <Button className="flex-1" disabled={busy !== null} onClick={approve}>
                <Check size={14} /> {busy === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button variant="destructive" disabled={busy !== null} onClick={() => setDenying(true)}>
                <X size={14} /> Deny
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
