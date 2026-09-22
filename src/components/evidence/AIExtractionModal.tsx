import { useMemo, useState } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EvidenceDocument, Relationship } from "@/types";
import { allEntities, ENTITY_TYPE_COLOR, ENTITY_TYPE_LABEL, RELATIONSHIP_TYPE_LABEL, relationships as graphRelationships } from "@/data";
import { commitExtraction } from "@/data/loader";
import { analyzeText, segmentText } from "@/nlp/extract";
import { buildEntity, buildRelationship } from "@/nlp/toGraph";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n";

const NEW_ENTITY_MIN_CONFIDENCE = 70;
const NEW_LINK_MIN_CONFIDENCE = 60;

export function AIExtractionModal({
  evidence,
  open,
  onOpenChange,
}: {
  evidence: EvidenceDocument | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const text = evidence?.extractedText ?? "";
  // the analysis is instant, so it simply runs whenever a document is opened
  const result = useMemo(() => (text ? analyzeText(text, allEntities, graphRelationships) : null), [text]);
  const segments = useMemo(() => (result ? segmentText(text, result) : []), [text, result]);

  const [pickedEntities, setPickedEntities] = useState<Set<string> | null>(null);
  const [pickedLinks, setPickedLinks] = useState<Set<string> | null>(null);
  const [done, setDone] = useState<{ entities: number; links: number } | null>(null);

  if (!evidence) return null;
  const doc = evidence;

  // defaults: everything new and confident is ticked
  const entitySel =
    pickedEntities ?? new Set((result?.entities ?? []).filter((e) => !e.entityId && e.confidence >= NEW_ENTITY_MIN_CONFIDENCE).map((e) => e.key));
  const available = new Set((result?.entities ?? []).filter((e) => e.entityId || entitySel.has(e.key)).map((e) => e.key));
  const linkable = (r: { sourceKey: string; targetKey: string }) => available.has(r.sourceKey) && available.has(r.targetKey);
  const linkSel =
    pickedLinks ?? new Set((result?.relationships ?? []).filter((r) => !r.existing && r.confidence >= NEW_LINK_MIN_CONFIDENCE).map((r) => r.id));

  const chosenLinks = (result?.relationships ?? []).filter((r) => linkSel.has(r.id) && !r.existing && linkable(r));
  const chosenEntities = (result?.entities ?? []).filter((e) => !e.entityId && entitySel.has(e.key));

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function handleConfirm() {
    if (!result) return;
    const stamp = Date.now().toString(36);
    const idFor = new Map<string, string>();
    const created = chosenEntities.map((e, i) => {
      const id = `nlp-${stamp}-${i}`;
      idFor.set(e.key, id);
      return buildEntity(e, id, doc.caseId, doc.fileName);
    });
    for (const e of result.entities) if (e.entityId) idFor.set(e.key, e.entityId);

    const rels: Relationship[] = chosenLinks.map((r, i) =>
      buildRelationship(r, `nlp-r-${stamp}-${i}`, idFor.get(r.sourceKey)!, idFor.get(r.targetKey)!, doc.caseId, doc.fileName),
    );
    // existing graph entities that this document mentions become part of this case too
    const touched = new Set<string>();
    for (const e of result.entities) if (e.entityId) touched.add(e.entityId);
    commitExtraction(doc.caseId, created, rels, [...touched]);
    setDone({ entities: created.length, links: rels.length });
    setTimeout(() => {
      onOpenChange(false);
      setDone(null);
      setPickedEntities(null);
      setPickedLinks(null);
    }, 1400);
  }

  const inGraph = result?.entities.filter((e) => e.entityId).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={15} className="text-cyan-400" /> {tr("nlp.reviewTitle")}
          </DialogTitle>
          <DialogDescription className="mono">{doc.fileName}</DialogDescription>
        </DialogHeader>

        {result ? (
          <>
            <p className="-mt-2 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
              <span className="flex items-center gap-1 text-cyan-300">
                <Zap size={11} /> {tr("nlp.analysed", { chars: result.stats.chars.toLocaleString("en-IN"), ms: result.stats.ms })}
              </span>
              <span>{tr("nlp.entitiesSummary", { n: result.entities.length, g: inGraph })}</span>
              <span>{tr("nlp.linksSummary", { n: result.relationships.length })}</span>
              <span>{tr("nlp.ruleBased")}</span>
            </p>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("nlp.sourceText")}</p>
                <ScrollArea className="h-80 rounded-md border border-border bg-panel-hover/30 p-3">
                  <p className="text-xs leading-relaxed text-text-secondary">
                    {segments.map((s, i) => {
                      if (!s.entity) return <span key={i}>{s.text}</span>;
                      const muted = !!s.entity.role;
                      const color = muted ? "#5c6a84" : ENTITY_TYPE_COLOR[s.entity.type];
                      return (
                        <span
                          key={i}
                          title={`${muted ? s.entity.role : ENTITY_TYPE_LABEL[s.entity.type]} · ${s.entity.confidence}%`}
                          className="rounded px-0.5 font-medium"
                          style={{ backgroundColor: `${color}22`, color, textDecoration: muted ? "underline dotted" : "underline", textDecorationColor: color }}
                        >
                          {s.text}
                        </span>
                      );
                    })}
                  </p>
                </ScrollArea>

                {(result.crimes.length > 0 || result.facts.length > 0) && (
                  <div className="mt-3 flex flex-col gap-2">
                    {result.crimes.length > 0 && (
                      <div>
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("nlp.kindOfCase")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.crimes.map((c) => (
                            <Badge key={c.category} variant="amber" title={tr("nlp.matched", { e: c.evidence })}>
                              {c.category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.facts.length > 0 && (
                      <div>
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("nlp.factsTitle")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.facts.map((f) => (
                            <Badge key={`${f.kind}-${f.text}`} variant="outline" className="mono">
                              {f.text}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ScrollArea className="h-[27rem] pr-2">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("nlp.entitiesFound")}</p>
                    <div className="flex flex-col gap-1.5">
                      {result.entities.length === 0 && <p className="text-xs text-text-muted">{tr("nlp.nothing")}</p>}
                      {result.entities.map((e) => (
                        <label
                          key={e.key}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
                            e.entityId ? "border-border bg-panel-hover/20" : entitySel.has(e.key) ? "cursor-pointer border-cyan-500/40 bg-cyan-500/10" : "cursor-pointer border-border bg-panel-hover/30",
                          )}
                        >
                          {e.entityId ? (
                            <Check size={13} className="text-green" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={entitySel.has(e.key)}
                              onChange={() => setPickedEntities(toggle(entitySel, e.key))}
                              aria-label={tr("nlp.addAria", { name: e.label })}
                            />
                          )}
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: ENTITY_TYPE_COLOR[e.type] }} />
                          <span className="min-w-0 flex-1 truncate text-xs text-text">
                            {e.label}
                            {e.aliases.length > 0 && <span className="text-text-muted"> ({tr("nlp.aka", { names: e.aliases.join(", ") })})</span>}
                          </span>
                          {e.tags.map((t) => (
                            <Badge key={t} variant={t === "accused" ? "red" : "outline"}>
                              {tr(`nlp.tag.${t}`)}
                            </Badge>
                          ))}
                          <Badge variant="outline">{ENTITY_TYPE_LABEL[e.type]}</Badge>
                          {e.entityId ? <Badge variant="green">{tr("nlp.inGraph")}</Badge> : <span className="mono text-[10px] text-text-muted">{e.confidence}%</span>}
                        </label>
                      ))}
                    </div>
                    {result.excluded.length > 0 && (
                      <p className="mt-2 text-[11px] text-text-muted">
                        {tr("nlp.excluded", { list: result.excluded.map((e) => e.label).join(", ") })}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("nlp.linksFound")}</p>
                    <div className="flex flex-col gap-1.5">
                      {result.relationships.length === 0 && <p className="text-xs text-text-muted">{tr("nlp.noLinks")}</p>}
                      {result.relationships.map((r) => {
                        const ok = linkable(r);
                        const disabled = r.existing || !ok;
                        return (
                          <label
                            key={r.id}
                            className={cn(
                              "flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs",
                              linkSel.has(r.id) && !disabled ? "cursor-pointer border-cyan-500/40 bg-cyan-500/10" : "border-border bg-panel-hover/30",
                              disabled ? "opacity-60" : "cursor-pointer",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              disabled={disabled}
                              checked={linkSel.has(r.id) && !disabled}
                              onChange={() => setPickedLinks(toggle(linkSel, r.id))}
                              aria-label={tr("nlp.addLinkAria", { label: r.label })}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="text-text">{r.label}</span>
                              <span className="mt-0.5 block text-[10px] text-text-muted">
                                {RELATIONSHIP_TYPE_LABEL[r.type]} · {tr("nlp.cue", { cue: r.cue })}
                                {r.existing && ` · ${tr("nlp.alreadyLinked")}`}
                                {!r.existing && !ok && ` · ${tr("nlp.needsBoth")}`}
                              </span>
                              <span className="mt-0.5 block text-[10px] italic text-text-muted" title={r.evidence}>
                                “{r.evidence.length > 120 ? r.evidence.slice(0, 117) + "…" : r.evidence}”
                              </span>
                            </span>
                            <span className="mono shrink-0 text-[10px] text-text-muted">{r.confidence}%</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">
            {tr("nlp.noText")}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tr("common.close")}
          </Button>
          {result && (
            <Button onClick={handleConfirm} disabled={!!done || (chosenEntities.length === 0 && chosenLinks.length === 0)}>
              {done ? (
                <>
                  <Check size={14} /> {tr("nlp.added", { e: done.entities, l: done.links })}
                </>
              ) : (
                tr("nlp.addBtn", { e: chosenEntities.length, l: chosenLinks.length })
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
