import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LevelBadge, RequestStatusBadge } from "@/components/shared/LevelPips";
import { timeAgo } from "@/lib/utils";
import { Initials, PageHeader } from "../components";
import { useAdminData } from "../useAdminData";
import type { AdminRequest } from "../types";

const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "cancelled", label: "Withdrawn" },
  { value: "all", label: "All" },
] as const;

export default function Requests() {
  const [status, setStatus] = useState<string>("pending");
  const { data, error } = useAdminData<{ requests: AdminRequest[]; pending: number }>(`/requests?status=${status}`);

  return (
    <>
      <PageHeader title="Access Requests" subtitle="Read the reason, check the identity documents, then decide what level to grant" />

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === "pending" && data && data.pending > 0 && (
                <span className="mono rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] leading-none text-amber">{data.pending}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 flex flex-col gap-2">
        {error && <p role="alert" className="text-xs text-red">{error}</p>}
        {!data && !error && <p className="text-xs text-text-muted">Loading…</p>}
        {data?.requests.length === 0 && (
          <Card className="py-12 text-center text-xs text-text-muted">
            {status === "pending" ? "No requests are waiting. You're all caught up." : "Nothing here."}
          </Card>
        )}
        {data?.requests.map((r) => (
          <Link key={r.id} to={`/requests/${r.id}`}>
            <Card className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:border-border-strong hover:bg-panel-hover">
              <Initials name={r.user.name} />
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-sm font-medium text-text">{r.user.name}</p>
                <p className="truncate text-[11px] text-text-muted">
                  {[r.user.badge, r.user.department].filter(Boolean).join(" · ") || r.user.username}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LevelBadge level={r.fromLevel} />
                <ArrowRight size={12} className="text-text-muted" />
                <LevelBadge level={r.requestedLevel} />
                {r.grantedLevel !== null && r.grantedLevel !== r.requestedLevel && (
                  <span className="text-[11px] text-green">granted {r.grantedLevel}</span>
                )}
              </div>
              <span className="flex items-center gap-1 text-[11px] text-text-muted">
                <Paperclip size={11} /> {r.files.length}
              </span>
              <span className="w-20 text-right text-[11px] text-text-muted">{timeAgo(new Date(r.createdAt).toISOString())}</span>
              <RequestStatusBadge status={r.status} />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
