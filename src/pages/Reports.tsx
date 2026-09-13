import { useMemo, useState } from "react";
import { FileText, Printer, ShieldAlert, CheckCircle2, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/shared/RiskBadge";
import {
  cases,
  getEntitiesForCase,
  getRelationshipsForCase,
  getEventsForCase,
  getAlertsForCase,
  computeCentrality,
  ENTITY_TYPE_LABEL,
} from "@/data";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function Reports() {
  const [openId, setOpenId] = useState<string | null>(null);
  const openCase = cases.find((c) => c.id === openId);

  const stats = useMemo(
    () =>
      cases.map((c) => ({
        c,
        entities: getEntitiesForCase(c.id).length,
        rels: getRelationshipsForCase(c.id).length,
        alerts: getAlertsForCase(c.id).length,
      })),
    [],
  );

  if (openCase) {
    const entities = getEntitiesForCase(openCase.id);
    const rels = getRelationshipsForCase(openCase.id);
    const events = getEventsForCase(openCase.id);
    const alerts = getAlertsForCase(openCase.id);
    const centrality = computeCentrality(entities.map((e) => e.id), rels);

    return (
      <div className="flex flex-col gap-4">
        <Button size="sm" variant="ghost" onClick={() => setOpenId(null)}><ChevronLeft size={14} /> Back to Reports</Button>
        <Card className="mx-auto max-w-3xl p-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="mono text-[11px] text-text-muted">{openCase.id}</p>
              <h2 className="text-lg font-semibold text-text">{openCase.title} — Investigation Report</h2>
              <p className="text-xs text-text-muted">Generated {formatDateTime(new Date().toISOString())}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={13} /> Export</Button>
          </div>

          <section className="mt-5">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">Case Summary</h3>
            <p className="text-xs leading-relaxed text-text-secondary">{openCase.description}</p>
          </section>

          <section className="mt-5">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">Key Entities</h3>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Entity</TableHead><TableHead>Type</TableHead><TableHead>Connections</TableHead><TableHead>Risk</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {centrality.slice(0, 6).map((row) => (
                  <TableRow key={row.entity.id}>
                    <TableCell className="font-medium">{row.entity.name}</TableCell>
                    <TableCell className="text-text-secondary">{ENTITY_TYPE_LABEL[row.entity.type]}</TableCell>
                    <TableCell className="mono">{row.degree}</TableCell>
                    <TableCell><RiskBadge level={row.entity.riskLevel} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="mt-5">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">Timeline Summary</h3>
            <p className="text-xs text-text-secondary">
              {events.length} logged events between {events[0] && formatDate(events[0].timestamp)} and{" "}
              {events.length > 0 && formatDate(events[events.length - 1].timestamp)}.
            </p>
          </section>

          <section className="mt-5">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">AI Findings</h3>
            <ul className="flex flex-col gap-1">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-xs text-text-secondary">
                  <ShieldAlert size={12} className="mt-0.5 shrink-0 text-amber" />
                  {a.title} <span className="mono text-text-muted">({a.confidence}% confidence)</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 border-t border-border pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">Investigator Sign-off</h3>
            {openCase.assignedInvestigators.map((inv) => (
              <div key={inv.badge} className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 size={13} className="text-green" />
                {inv.name} — {inv.badge} <span className="mono text-text-muted">· digitally signed</span>
              </div>
            ))}
          </section>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Reports</h1>
        <p className="text-xs text-text-secondary">Auto-generated investigation reports, one per case</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ c, entities, rels, alerts }) => (
          <Card key={c.id} className="cursor-pointer p-4 transition-colors hover:border-border-strong" onClick={() => setOpenId(c.id)}>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-cyan-500/25 bg-cyan-500/10">
                <FileText size={16} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="mono text-[10px] text-text-muted">{c.id}</p>
                <p className="truncate text-sm font-medium text-text">{c.title}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-text-muted">
              <span>{entities} entities</span>
              <span>{rels} links</span>
              <span>{alerts} findings</span>
            </div>
            <CardContent className="p-0 pt-3">
              <Badge variant={c.status === "active" ? "cyan" : c.status === "under_review" ? "amber" : "green"}>
                {c.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
