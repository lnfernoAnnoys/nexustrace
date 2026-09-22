import { useMemo, useState } from "react";
import { ScanLine, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCard } from "@/components/shared/AlertCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { alerts, allEntities, evidenceDocuments, ENTITY_TYPE_COLOR, ENTITY_TYPE_LABEL, RELATIONSHIP_TYPE_LABEL, relationships } from "@/data";
import { useDataVersion } from "@/data/store";
import { analyzeText, segmentText, type NlpResult } from "@/nlp/extract";
import { tr } from "@/i18n";

export default function AIInsights() {
  const version = useDataVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const samples = useMemo(() => evidenceDocuments.filter((d) => d.extractedText), [version]);
  const [docId, setDocId] = useState(samples[0]?.id ?? "");
  const [text, setText] = useState(samples[0]?.extractedText ?? "");
  const [result, setResult] = useState<{ text: string; nlp: NlpResult } | null>(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  function analyze() {
    setResult({ text, nlp: analyzeText(text, allEntities, relationships) });
  }

  function pick(id: string) {
    setDocId(id);
    const doc = samples.find((d) => d.id === id);
    setText(doc?.extractedText ?? "");
    setResult(null);
  }

  const segments = useMemo(() => (result ? segmentText(result.text, result.nlp) : []), [result]);
  const nlp = result?.nlp;

  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
        (a) => (severityFilter === "all" || a.severity === severityFilter) && (categoryFilter === "all" || a.category === categoryFilter),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [severityFilter, categoryFilter, version],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text">{tr("nav.aiInsights")}</h1>
        <p className="text-xs text-text-secondary">{tr("ai.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <SectionHeader
            title={tr("ai.lab")}
            description={tr("ai.labDesc")}
            action={
              <div className="flex items-center gap-2">
                <Select value={docId} onValueChange={pick}>
                  <SelectTrigger className="w-72" aria-label={tr("ai.sampleAria")}>
                    <SelectValue placeholder={tr("ai.loadSample")} />
                  </SelectTrigger>
                  <SelectContent>
                    {samples.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={analyze} disabled={!text.trim()}>
                  <ScanLine size={13} /> {tr("ai.analyze")}
                </Button>
              </div>
            }
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            rows={5}
            placeholder={tr("ai.textPh")}
            aria-label={tr("ai.textAria")}
            className="text-xs"
          />

          {nlp && (
            <>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Zap size={11} /> {tr("ai.stats", { chars: nlp.stats.chars.toLocaleString("en-IN"), s: nlp.stats.sentences, ms: nlp.stats.ms })}
                </span>
                <span>{tr("cases.entities", { n: nlp.entities.length })}</span>
                <span>{tr("nlp.linksSummary", { n: nlp.relationships.length })}</span>
              </p>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("ai.marked")}</p>
                  <ScrollArea className="h-72 rounded-md border border-border bg-panel-hover/30 p-3">
                    <p className="text-xs leading-relaxed text-text-secondary">
                      {segments.map((s, i) => {
                        if (!s.entity) return <span key={i}>{s.text}</span>;
                        const muted = !!s.entity.role;
                        const color = muted ? "#5c6a84" : ENTITY_TYPE_COLOR[s.entity.type];
                        return (
                          <span key={i} title={`${muted ? s.entity.role : ENTITY_TYPE_LABEL[s.entity.type]} · ${s.entity.confidence}%`} className="rounded px-0.5 font-medium" style={{ backgroundColor: `${color}22`, color, textDecoration: "underline", textDecorationColor: color }}>
                            {s.text}
                          </span>
                        );
                      })}
                    </p>
                  </ScrollArea>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("nav.entities")}</p>
                  <ScrollArea className="h-72 rounded-md border border-border p-2">
                    <div className="flex flex-col gap-1.5">
                      {[...nlp.entities, ...nlp.excluded].map((e) => (
                        <div key={e.key} className="flex items-center gap-2 rounded-md border border-border bg-panel-hover/30 px-2.5 py-1.5">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: e.role ? "#5c6a84" : ENTITY_TYPE_COLOR[e.type] }} />
                          <span className="min-w-0 flex-1 truncate text-xs text-text">{e.label}</span>
                          {e.role ? <Badge variant="outline">{e.role}</Badge> : <Badge variant="outline">{ENTITY_TYPE_LABEL[e.type]}</Badge>}
                          {e.entityId && <Badge variant="green">{tr("nlp.inGraph")}</Badge>}
                          <span className="mono text-[10px] text-text-muted">{e.confidence}%</span>
                        </div>
                      ))}
                      {nlp.entities.length + nlp.excluded.length === 0 && <p className="p-3 text-xs text-text-muted">{tr("ai.nothing")}</p>}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("ai.linksFacts")}</p>
                  <ScrollArea className="h-72 rounded-md border border-border p-2">
                    <div className="flex flex-col gap-1.5">
                      {nlp.relationships.map((r) => (
                        <div key={r.id} className="rounded-md border border-border bg-panel-hover/30 px-2.5 py-1.5 text-xs">
                          <p className="text-text">{r.label}</p>
                          <p className="text-[10px] text-text-muted">
                            {RELATIONSHIP_TYPE_LABEL[r.type]} · {tr("nlp.cue", { cue: r.cue })} · {r.confidence}%
                          </p>
                        </div>
                      ))}
                      {nlp.relationships.length === 0 && <p className="p-1 text-xs text-text-muted">{tr("ai.noLinks")}</p>}
                      {nlp.crimes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {nlp.crimes.map((c) => (
                            <Badge key={c.category} variant="amber" title={`Matched: ${c.evidence}`}>
                              {c.category}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {nlp.facts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {nlp.facts.map((f) => (
                            <Badge key={`${f.kind}-${f.text}`} variant="outline" className="mono">
                              {f.text}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            title={tr("ai.patterns")}
            description={tr("ai.patternsDesc")}
            action={
              <div className="flex gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tr("ai.allSeverities")}</SelectItem>
                    <SelectItem value="critical">{tr("prio.critical")}</SelectItem>
                    <SelectItem value="high">{tr("prio.high")}</SelectItem>
                    <SelectItem value="medium">{tr("prio.medium")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tr("ai.allCategories")}</SelectItem>
                    <SelectItem value="financial_anomaly">{tr("alertcat.financial_anomaly")}</SelectItem>
                    <SelectItem value="communication_anomaly">{tr("alertcat.communication_anomaly")}</SelectItem>
                    <SelectItem value="movement_anomaly">{tr("alertcat.movement_anomaly")}</SelectItem>
                    <SelectItem value="network_structure_anomaly">{tr("alertcat.network_structure_anomaly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {filteredAlerts.map((a) => (
            <AlertCard key={a.id} alert={a} onReview={() => {}} />
          ))}
          {filteredAlerts.length === 0 && <p className="col-span-2 py-8 text-center text-xs text-text-muted">{tr("ai.noFindings")}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
