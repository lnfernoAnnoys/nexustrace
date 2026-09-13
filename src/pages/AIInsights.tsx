import { useMemo, useState } from "react";
import { Sparkles, ScanLine, Plus, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCard } from "@/components/shared/AlertCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { evidenceDocuments, ENTITY_TYPE_COLOR, ENTITY_TYPE_LABEL, alerts } from "@/data";
import { EXTRACTION_RESULTS } from "@/data/extractions";

const SAMPLE_DOCS = evidenceDocuments.filter((d) => EXTRACTION_RESULTS[d.id]);

function highlight(text: string, entities: { label: string; type: string }[]) {
  let segments: { text: string; color?: string }[] = [{ text }];
  for (const e of entities) {
    const next: typeof segments = [];
    for (const seg of segments) {
      if (seg.color) { next.push(seg); continue; }
      const idx = seg.text.indexOf(e.label);
      if (idx === -1) { next.push(seg); continue; }
      next.push({ text: seg.text.slice(0, idx) });
      next.push({ text: e.label, color: ENTITY_TYPE_COLOR[e.type as keyof typeof ENTITY_TYPE_COLOR] });
      next.push({ text: seg.text.slice(idx + e.label.length) });
    }
    segments = next;
  }
  return segments;
}

export default function AIInsights() {
  const [docId, setDocId] = useState(SAMPLE_DOCS[0]?.id ?? "");
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const doc = evidenceDocuments.find((d) => d.id === docId);
  const result = doc ? EXTRACTION_RESULTS[doc.id] : undefined;
  const segments = doc?.extractedText && result ? highlight(doc.extractedText, result.entities) : null;

  function runAnalysis() {
    setPhase("processing");
    setProgress(0);
    setAdded(new Set());
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase("done");
          return 100;
        }
        return p + 10;
      });
    }, 90);
  }

  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (severityFilter === "all" || a.severity === severityFilter) &&
          (categoryFilter === "all" || a.category === categoryFilter),
      ),
    [severityFilter, categoryFilter],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text">AI Insights</h1>
        <p className="text-xs text-text-secondary">Entity extraction demo and network-wide suspicious pattern detection</p>
      </div>

      <Card>
        <CardHeader>
          <SectionHeader
            title="AI Entity Extraction"
            description="Run unstructured investigation text through the extraction pipeline"
            action={
              <div className="flex items-center gap-2">
                <Select value={docId} onValueChange={(v) => { setDocId(v); setPhase("idle"); }}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SAMPLE_DOCS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.fileName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={runAnalysis} disabled={phase === "processing"}>
                  <ScanLine size={13} /> {phase === "processing" ? "Analyzing…" : "Analyze"}
                </Button>
              </div>
            }
          />
        </CardHeader>
        <CardContent>
          {phase === "processing" && (
            <div className="mb-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-cyan-300">
                <Sparkles size={12} className="animate-pulse-slow" /> Running NLP entity recognition and relationship inference…
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">Source Text</p>
              <ScrollArea className="h-64 rounded-md border border-border bg-panel-hover/30 p-3">
                <p className="text-xs leading-relaxed text-text-secondary">
                  {phase === "done" && segments
                    ? segments.map((s, i) =>
                        s.color ? (
                          <span key={i} className="rounded px-0.5 font-medium" style={{ backgroundColor: `${s.color}22`, color: s.color, textDecoration: "underline", textDecorationColor: s.color }}>
                            {s.text}
                          </span>
                        ) : (
                          <span key={i}>{s.text}</span>
                        ),
                      )
                    : doc?.extractedText}
                </p>
              </ScrollArea>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Extracted Entities {phase === "done" && `(${result?.entities.length ?? 0})`}
              </p>
              {phase !== "done" ? (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border text-xs text-text-muted">
                  Run analysis to extract entities
                </div>
              ) : (
                <ScrollArea className="h-64 rounded-md border border-border p-2">
                  <div className="flex flex-col gap-1.5">
                    {result?.entities.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-panel-hover/30 px-2.5 py-1.5">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: ENTITY_TYPE_COLOR[e.type] }} />
                        <span className="min-w-0 flex-1 truncate text-xs text-text">{e.label}</span>
                        <Badge variant="outline">{ENTITY_TYPE_LABEL[e.type]}</Badge>
                        <span className="mono text-[10px] text-text-muted">{e.confidence}%</span>
                        <button
                          onClick={() => setAdded((prev) => new Set(prev).add(i))}
                          className="ml-1 flex size-5 items-center justify-center rounded border border-border-strong text-text-muted hover:text-cyan-300"
                        >
                          {added.has(i) ? <Check size={11} className="text-green" /> : <Plus size={11} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            title="Suspicious Pattern Detection"
            description="AI-flagged anomalies across every active investigation"
            action={
              <div className="flex gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="financial_anomaly">Financial Anomaly</SelectItem>
                    <SelectItem value="communication_anomaly">Communication Anomaly</SelectItem>
                    <SelectItem value="movement_anomaly">Movement Anomaly</SelectItem>
                    <SelectItem value="network_structure_anomaly">Network Structure Anomaly</SelectItem>
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
          {filteredAlerts.length === 0 && (
            <p className="col-span-2 py-8 text-center text-xs text-text-muted">No alerts match the selected filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
