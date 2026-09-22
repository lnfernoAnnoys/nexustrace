import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderLock, Users, ShieldAlert, TrendingUp, ChevronRight, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { AlertCard } from "@/components/shared/AlertCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { KeyPlayersPanel } from "@/components/graph/KeyPlayersPanel";
import {
  cases,
  allEntities,
  relationships,
  alerts,
  people,
  computeCentrality,
  RELATIONSHIP_TYPE_LABEL,
} from "@/data";
import { formatDate } from "@/lib/utils";
import { tr, trn } from "@/i18n";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  active: "#22d3ee",
  under_review: "#f59e0b",
  closed: "#34d399",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const activeCases = cases.filter((c) => c.status === "active").length;
  const highRisk = people.filter((p) => p.riskLevel === "high" || p.riskLevel === "critical").length;
  const unreviewedAlerts = alerts.filter((a) => !a.reviewed);

  const centrality = useMemo(
    () => computeCentrality(allEntities.map((e) => e.id), relationships).slice(0, 5),
    [],
  );

  const statusData = useMemo(
    () =>
      ["active", "under_review", "closed"].map((s) => ({
        name: tr(`status.${s}` as "status.active"),
        value: cases.filter((c) => c.status === s).length,
        key: s,
      })),
    [],
  );

  const relTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of relationships) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    return [...counts.entries()].map(([type, count]) => ({
      type: RELATIONSHIP_TYPE_LABEL[type as keyof typeof RELATIONSHIP_TYPE_LABEL],
      count,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text">{tr("nav.commandCenter")}</h1>
        <p className="text-xs text-text-secondary">{tr("dash.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={tr("dash.stat.active")} value={activeCases} icon={FolderLock} accent="cyan" trend={tr("dash.stat.total", { n: cases.length })} />
        <StatCard label={tr("dash.stat.entities")} value={allEntities.length} icon={Users} accent="cyan" trend={tr("dash.stat.entitiesTrend")} />
        <StatCard label={tr("dash.stat.patterns")} value={alerts.length} icon={ShieldAlert} accent="red" trend={tr("dash.stat.review", { n: unreviewedAlerts.length })} />
        <StatCard label={tr("dash.stat.highRisk")} value={highRisk} icon={TrendingUp} accent="amber" trend={tr("dash.stat.highRiskTrend")} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <SectionHeader
              title={tr("dash.recent")}
              description={tr("dash.recentDesc")}
              action={<Button size="sm" variant="ghost" onClick={() => navigate("/cases")}>{tr("common.viewAll")} <ChevronRight size={13} /></Button>}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cases
              .slice()
              .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.updatedAt.localeCompare(a.updatedAt))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="flex items-center justify-between rounded-lg border border-border bg-panel-hover/30 px-3.5 py-3 text-left transition-colors hover:border-border-strong hover:bg-panel-hover"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono text-[10px] text-text-muted">{c.id}</span>
                      <Badge variant={c.status === "active" ? "cyan" : c.status === "under_review" ? "amber" : "green"}>
                        {tr(`status.${c.status}`)}
                      </Badge>
                      <Badge variant={c.priority === "critical" ? "red" : c.priority === "high" ? "orange" : "outline"}>
                        {tr(`prio.${c.priority}`)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-text">{c.title}</p>
                    <p className="text-[11px] text-text-muted">{trn("dash.linked", c.entityIds.length)}{c.year ? ` · ${tr("dash.cameToLight", { year: c.year })}` : ` · ${tr("dash.updated", { date: formatDate(c.updatedAt) })}`}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-text-muted" />
                </button>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr("dash.keyIndividuals")}</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyPlayersPanel rows={centrality} activeId={selectedNode} onSelect={(id) => navigate(`/entities/person/${id}`)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <SectionHeader title={tr("dash.feed")} description={tr("dash.feedDesc")} />
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {alerts
              .slice()
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .slice(0, 5)
              .map((a) => (
                <AlertCard key={a.id} alert={a} onReview={() => navigate(`/cases/${a.caseId}`)} />
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr("dash.byStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={3}>
                  {statusData.map((d) => (
                    <Cell key={d.key} fill={STATUS_COLORS[d.key]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0e1520", border: "1px solid #2c3752", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#e7edf7" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] text-text-secondary">
              {statusData.map((d) => (
                <span key={d.key} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.key] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <SectionHeader
              title={tr("dash.snapshot")}
              description={tr("dash.snapshotDesc")}
              action={<Button size="sm" variant="outline" onClick={() => navigate("/network")}>{tr("dash.openNetwork")} <Share2 size={13} /></Button>}
            />
          </CardHeader>
          <CardContent className="h-[320px] p-0">
            <NetworkGraph
              entities={allEntities}
              relationships={relationships}
              selectedId={selectedNode}
              onSelectNode={setSelectedNode}
              layout="force"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr("dash.relTypes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={relTypeData} layout="vertical" margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#212a3b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#5c6a84", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="type" type="category" width={110} tick={{ fill: "#93a1b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0e1520", border: "1px solid #2c3752", borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: "rgba(34,211,238,0.06)" }}
                />
                <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
