import { useMemo, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EvidenceDocument, Relationship } from "@/types";
import { EXTRACTION_RESULTS } from "@/data/extractions";
import { ENTITY_TYPE_COLOR, ENTITY_TYPE_LABEL } from "@/data";
import { cn } from "@/lib/utils";

function highlightText(text: string, entities: { label: string; type: string }[]) {
  let segments: { text: string; color?: string }[] = [{ text }];
  for (const e of entities) {
    const next: typeof segments = [];
    for (const seg of segments) {
      if (seg.color) {
        next.push(seg);
        continue;
      }
      const idx = seg.text.indexOf(e.label);
      if (idx === -1) {
        next.push(seg);
      } else {
        next.push({ text: seg.text.slice(0, idx) });
        next.push({ text: e.label, color: ENTITY_TYPE_COLOR[e.type as keyof typeof ENTITY_TYPE_COLOR] });
        next.push({ text: seg.text.slice(idx + e.label.length) });
      }
    }
    segments = next;
  }
  return segments;
}

export function AIExtractionModal({
  evidence,
  open,
  onOpenChange,
  onConfirm,
}: {
  evidence: EvidenceDocument | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (relationships: Relationship[]) => void;
}) {
  const result = evidence ? EXTRACTION_RESULTS[evidence.id] : undefined;
  const [checkedRels, setCheckedRels] = useState<Set<number>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  const segments = useMemo(() => {
    if (!evidence?.extractedText || !result) return null;
    return highlightText(evidence.extractedText, result.entities);
  }, [evidence, result]);

  if (!evidence) return null;
  const doc = evidence;

  function toggle(i: number) {
    setCheckedRels((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function handleConfirm() {
    if (!result) return;
    const newRels: Relationship[] = [];
    result.relationships.forEach((r, i) => {
      if (r.newRelationship && checkedRels.has(i)) {
        newRels.push({
          id: `ai-${doc.id}-${i}`,
          type: r.newRelationship.type,
          sourceId: r.newRelationship.sourceId,
          targetId: r.newRelationship.targetId,
          strength: r.newRelationship.strength,
          frequency: 1,
          startDate: doc.uploadedAt.slice(0, 10),
          endDate: doc.uploadedAt.slice(0, 10),
          evidenceSource: `AI extraction — ${doc.fileName}`,
          caseId: doc.caseId,
          confidence: r.confidence,
          note: "Added via AI-assisted evidence extraction review",
        });
      }
    });
    setConfirmed(true);
    onConfirm(newRels);
    setTimeout(() => {
      onOpenChange(false);
      setConfirmed(false);
      setCheckedRels(new Set());
    }, 1100);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={15} className="text-cyan-400" /> AI Extraction Review
          </DialogTitle>
          <DialogDescription className="mono">{evidence.fileName}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">Source Document</p>
              <ScrollArea className="h-64 rounded-md border border-border bg-panel-hover/30 p-3">
                <p className="text-xs leading-relaxed text-text-secondary">
                  {segments?.map((s, i) =>
                    s.color ? (
                      <span key={i} className="rounded px-0.5 font-medium" style={{ backgroundColor: `${s.color}22`, color: s.color, textDecoration: "underline", textDecorationColor: s.color }}>
                        {s.text}
                      </span>
                    ) : (
                      <span key={i}>{s.text}</span>
                    ),
                  )}
                </p>
              </ScrollArea>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">Extracted Entities</p>
                <div className="flex flex-col gap-1.5">
                  {result.entities.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-panel-hover/30 px-2.5 py-1.5">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: ENTITY_TYPE_COLOR[e.type] }} />
                      <span className="min-w-0 flex-1 truncate text-xs text-text">{e.label}</span>
                      <Badge variant="outline">{ENTITY_TYPE_LABEL[e.type]}</Badge>
                      <span className="mono text-[10px] text-text-muted">{e.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">Extracted Relationships</p>
                <div className="flex flex-col gap-1.5">
                  {result.relationships.map((r, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
                        checkedRels.has(i) ? "border-cyan-500/40 bg-cyan-500/10" : "border-border bg-panel-hover/30",
                        !r.newRelationship && "opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checkedRels.has(i)}
                        onChange={() => toggle(i)}
                        disabled={!r.newRelationship}
                      />
                      <span className="flex-1 text-text-secondary">
                        {r.label}
                        {!r.newRelationship && <span className="ml-1.5 text-[10px] text-text-muted">(already in graph)</span>}
                      </span>
                      <span className="mono shrink-0 text-[10px] text-text-muted">{r.confidence}%</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">
            This document has already been parsed as structured data. No narrative entity extraction required.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {result && (
            <Button onClick={handleConfirm} disabled={confirmed || checkedRels.size === 0}>
              {confirmed ? <><Check size={14} /> Added to Case Graph</> : "Confirm & Add to Graph"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
