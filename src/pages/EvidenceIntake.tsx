import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { evidenceDocuments as initialDocs, cases, getCase } from "@/data";
import type { EvidenceDocument, EvidenceType } from "@/types";
import { formatDate, cn } from "@/lib/utils";

const TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: "fir", label: "FIR / Police Report" },
  { value: "cdr", label: "Call Detail Record (CDR)" },
  { value: "financial_record", label: "Financial Transaction Record" },
  { value: "surveillance_report", label: "Surveillance Report" },
  { value: "social_media", label: "Social Media Intelligence" },
  { value: "criminal_history", label: "Criminal History Record" },
  { value: "intelligence_report", label: "Intelligence Report" },
];

const STEPS = ["Uploaded", "Extracting Entities", "Identifying Relationships", "Completed"];

export default function EvidenceIntake() {
  const [docs, setDocs] = useState<EvidenceDocument[]>(initialDocs);
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [docType, setDocType] = useState<EvidenceType>("fir");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(
    (fileName: string, sizeKb: number) => {
      const id = `ev-new-${Date.now()}`;
      const doc: EvidenceDocument = {
        id,
        caseId,
        type: docType,
        fileName,
        uploadedAt: new Date().toISOString(),
        extractionStatus: "pending",
        sizeKb,
      };
      setDocs((prev) => [doc, ...prev]);
      setTimeout(() => {
        setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, extractionStatus: "processing" } : d)));
      }, 1500);
      setTimeout(() => {
        setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, extractionStatus: "completed" } : d)));
      }, 3800);
    },
    [caseId, docType],
  );

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => ingest(f.name, Math.max(1, Math.round(f.size / 1024))));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text">Evidence Intake</h1>
        <p className="text-xs text-text-secondary">Ingest FIRs, CDRs, financial records, and intelligence reports for AI processing</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Assign to Case</Label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.id} — {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Document Category</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as EvidenceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-12 text-center transition-colors",
              dragActive ? "border-cyan-400 bg-cyan-500/5" : "border-border hover:border-border-strong",
            )}
          >
            <UploadCloud size={28} className="text-cyan-400" />
            <p className="text-sm text-text">Drag & drop files here, or click to browse</p>
            <p className="text-[11px] text-text-muted">PDF, XLSX, CSV, JSON — will be routed to the extraction pipeline</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ingested Documents ({docs.length})</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {docs
            .slice()
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
            .map((doc) => {
              const stepIndex = { pending: 1, processing: 2, completed: 4 }[doc.extractionStatus];
              const relatedCase = getCase(doc.caseId);
              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-panel-hover">
                      <FileText size={14} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text">{doc.fileName}</p>
                      <p className="mono text-[10px] text-text-muted">{relatedCase?.id} · {doc.sizeKb} KB</p>
                    </div>
                    <Badge variant={doc.extractionStatus === "completed" ? "green" : doc.extractionStatus === "processing" ? "cyan" : "outline"}>
                      {doc.extractionStatus}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-col gap-1.5">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={cn("size-1.5 rounded-full", i < stepIndex ? "bg-cyan-400" : "bg-panel-hover")} />
                        <span className={cn("text-[10px]", i < stepIndex ? "text-text-secondary" : "text-text-muted")}>
                          {step}
                        </span>
                        {i === stepIndex - 1 && doc.extractionStatus === "processing" && (
                          <Sparkles size={10} className="animate-pulse-slow text-cyan-400" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-text-muted">Uploaded {formatDate(doc.uploadedAt)}</p>
                </Card>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
