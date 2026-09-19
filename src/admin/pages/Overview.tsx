import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Inbox, KeySquare, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { LevelBadge } from "@/components/shared/LevelPips";
import { ACCESS_LEVELS, levelTone } from "@/lib/access";
import { timeAgo } from "@/lib/utils";
import { Initials, PageHeader, describeAudit } from "../components";
import { useAdminData } from "../useAdminData";
import type { AdminRequest, AuditEntry } from "../types";

interface OverviewData {
  totalUsers: number;
  admins: number;
  twoFactorEnabled: number;
  pendingRequests: number;
  levelCounts: number[];
  waiting: AdminRequest[];
  recentActivity: AuditEntry[];
}

const TONE_FILL = { blue: "#60a5fa", cyan: "#a78bfa", amber: "#f59e0b", red: "#f43f5e" } as const;
const ago = (ms: number) => timeAgo(new Date(ms).toISOString());

export default function Overview() {
  const { data, error } = useAdminData<OverviewData>("/overview");

  if (!data) return error ? <p role="alert" className="text-xs text-red">{error}</p> : <p className="text-xs text-text-muted">Loading…</p>;

  const chart = ACCESS_LEVELS.map((level) => ({ level, accounts: data.levelCounts[level - 1] }));
  const twoFactorPct = data.totalUsers ? Math.round((data.twoFactorEnabled / data.totalUsers) * 100) : 0;

  return (
    <>
      <PageHeader title="Overview" subtitle="Who has access to NexusTrace, and what is waiting for your decision" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Accounts" value={data.totalUsers} icon={Users} accent="cyan" />
        <StatCard label="Waiting for review" value={data.pendingRequests} icon={Inbox} accent="amber" />
        <StatCard label="Administrators" value={data.admins} icon={KeySquare} accent="cyan" />
        <StatCard label="Two-factor on" value={twoFactorPct} suffix="%" icon={ShieldCheck} accent="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Accounts by access level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#212a3b" vertical={false} />
                <XAxis
                  dataKey="level"
                  tickFormatter={(l) => `L${l}`}
                  tick={{ fill: "#93a1b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fill: "#5c6a84", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "#0e1520", border: "1px solid #2c3752", borderRadius: 6, fontSize: 12 }}
                  labelFormatter={(l) => `Level ${l}`}
                  formatter={(v) => [v, "Accounts"]}
                />
                <Bar dataKey="accounts" radius={[3, 3, 0, 0]}>
                  {chart.map((d) => (
                    <Cell key={d.level} fill={TONE_FILL[levelTone(d.level)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Waiting for review</CardTitle>
            <Link to="/requests" className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200">
              All requests <ArrowRight size={11} />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {data.waiting.length === 0 && <p className="py-6 text-center text-xs text-text-muted">Nothing is waiting. You're all caught up.</p>}
            {data.waiting.map((r) => (
              <Link
                key={r.id}
                to={`/requests/${r.id}`}
                className="flex items-center gap-2.5 rounded-md border border-border bg-panel-hover/30 px-2.5 py-2 transition-colors hover:border-border-strong hover:bg-panel-hover"
              >
                <Initials name={r.user.name} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text">{r.user.name}</p>
                  <p className="text-[10px] text-text-muted">{ago(r.createdAt)}</p>
                </div>
                <span className="mono text-[11px] text-text-secondary">L{r.fromLevel}</span>
                <ArrowRight size={11} className="text-text-muted" />
                <LevelBadge level={r.requestedLevel} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent changes</CardTitle>
          <Link to="/audit" className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200">
            Full audit log <ArrowRight size={11} />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {data.recentActivity.length === 0 && <p className="py-4 text-center text-xs text-text-muted">No changes have been made yet.</p>}
          {data.recentActivity.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2 text-xs text-text-secondary">
              <span className="min-w-0 flex-1">
                <span className="text-text">{e.actorName}</span>: {describeAudit(e)}
              </span>
              <span className="shrink-0 text-[10px] text-text-muted">{ago(e.at)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
