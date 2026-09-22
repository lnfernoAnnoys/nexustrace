import { useMemo, useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles, ExternalLink, ClipboardPaste } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AIExtractionModal } from "@/components/evidence/AIExtractionModal";
import { allEntities, cases, evidenceDocuments, getCase, relationships } from "@/data";
import { bumpData, useDataVersion } from "@/data/store";
import { analyzeText } from "@/nlp/extract";
import type { EvidenceDocument, EvidenceType } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { tr } from "@/i18n";

const TYPE_VALUES: EvidenceType[] = ["fir", "cdr", "financial_record", "surveillance_report", "social_media", "criminal_history", "intelligence_report"];

const READABLE = /\.(txt|md|csv|json|log)$/i;

export default function EvidenceIntake() {
  const version = useDataVersion();
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [docType, setDocType] = useState<EvidenceType>("fir");
  const [pasted, setPasted] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState<EvidenceDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // every document's counts, worked out by the NLP engine (a few milliseconds each)
  const docs = useMemo(
    () =>
      [...evidenceDocuments]
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        .map((doc) => ({ doc, nlp: doc.extractedText ? analyzeText(doc.extractedText, allEntities, relationships) : null })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  function ingest(fileName: string, text: string, sizeBytes: number) {
    const doc: EvidenceDocument = {
      id: `doc-${Date.now().toString(36)}`,
      caseId,
      type: docType,
      fileName,
      uploadedAt: new Date().toISOString(),
      extractionStatus: "completed",
      sizeKb: Math.max(1, Math.round(sizeBytes / 1024)),
      extractedText: text,
    };
    evidenceDocuments.unshift(doc);
    bumpData();
    setOpen(doc);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setNotice("");
    for (const f of Array.from(files)) {
      if (!READABLE.test(f.name)) {
        setNotice(tr("ev.notReadable", { name: f.name }));
        continue;
      }
      ingest(f.name, await f.text(), f.size);
    }
  }

  function analysePasted() {
    const text = pasted.trim();
    if (!text) return;
    ingest(`PASTED_TEXT_${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.txt`, text, new Blob([text]).size);
    setPasted("");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text">{tr("nav.evidence")}</h1>
        <p className="text-xs text-text-secondary">{tr("ev.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">{tr("ev.assign")}</Label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{tr("ev.category")}</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as EvidenceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_VALUES.map((v) => <SelectItem key={v} value={v}>{tr(`evd.${v}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5"><ClipboardPaste size={12} /> {tr("ev.paste")}</Label>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={5}
              placeholder={tr("ev.pastePh")}
              aria-label={tr("ai.textAria")}
              className="text-xs"
            />
            <Button size="sm" className="mt-2" onClick={analysePasted} disabled={!pasted.trim() || !caseId}>
              <Sparkles size={13} /> {tr("ev.analyse")}
            </Button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); void handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-8 text-center transition-colors",
              dragActive ? "border-cyan-400 bg-cyan-500/5" : "border-border hover:border-border-strong",
            )}
          >
            <UploadCloud size={24} className="text-cyan-400" />
            <p className="text-sm text-text">{tr("ev.drop")}</p>
            <p className="text-[11px] text-text-muted">{tr("ev.dropHint")}</p>
            <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.csv,.json,.log" className="hidden" onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }} />
          </div>
          {notice && <p role="alert" className="text-xs text-amber">{notice}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tr("ev.documents", { n: docs.length })}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {docs.map(({ doc, nlp }) => {
            const relatedCase = getCase(doc.caseId);
            return (
              <Card
                key={doc.id}
                className={cn("p-4", nlp && "cursor-pointer transition-colors hover:border-border-strong")}
                onClick={() => nlp && setOpen(doc)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-panel-hover">
                    <FileText size={14} className="text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-text" title={doc.fileName}>{doc.fileName}</p>
                    <p className="truncate text-[10px] text-text-muted">{relatedCase?.title}</p>
                  </div>
                  <Badge variant={nlp ? "green" : "outline"}>{nlp ? tr("ev.readable") : tr("ev.noText")}</Badge>
                </div>

                {nlp ? (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-secondary">
                    <span>{tr("ev.nEntities", { n: nlp.entities.length })}</span>
                    <span>{tr("ev.nInGraph", { n: nlp.entities.filter((e) => e.entityId).length })}</span>
                    <span>{tr("nlp.linksSummary", { n: nlp.relationships.length })}</span>
                    <span className="text-cyan-300">{nlp.stats.ms} ms</span>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-text-muted">{tr("ev.noTextNote")}</p>
                )}
                <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                  <span>{tr("ev.added", { date: formatDate(doc.uploadedAt), kb: doc.sizeKb })}</span>
                  {doc.sourceUrl && (
                    <a href={doc.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-cyan-300" title={tr("ev.sourceTitle", { name: doc.sourceName ?? "link" })}>
                      <ExternalLink size={10} /> {doc.sourceName ?? "Source"}
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <AIExtractionModal evidence={open} open={!!open} onOpenChange={(v) => !v && setOpen(null)} />
    </div>
  );
}
