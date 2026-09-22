import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cases as allCases } from "@/data";
import { autoMap, buildRows, FIELDS, importCases, templateCsv, type FieldKey, type ImportSummary, type Mapping } from "@/data/caseImport";
import { useAuth } from "@/context/AuthContext";
import { FileProblem, MAX_ROWS, readTableFile, type Sheet } from "@/lib/tabular";
import { cn } from "@/lib/utils";
import { tr, trn } from "@/i18n";

type Phase = "pick" | "preview" | "working" | "done";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([templateCsv()], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "nexustrace-cases-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** The "Import from file" tab of the New Case dialog: one CSV or Excel file becomes many cases. */
export function ImportCasesPanel({ onClose, onCreated }: { onClose: () => void; onCreated: (s: ImportSummary) => void }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map());
  const [useNlp, setUseNlp] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const sheet = sheets[sheetIdx];
  const headers = sheet?.rows[0] ?? [];
  const existingTitles = useMemo(() => new Set(allCases.map((c) => c.title.trim().toLowerCase())), []);
  const built = useMemo(() => (sheet && mapping ? buildRows(sheet.rows.slice(1), mapping, existingTitles) : []), [sheet, mapping, existingTitles]);
  const isIncluded = (i: number) => built[i].title !== "" && (overrides.get(i) ?? built[i].include);
  const chosen = built.filter((_, i) => isIncluded(i));
  const titleMissing = mapping !== null && mapping.title === null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const read = await readTableFile(file);
      setFileName(file.name);
      setSheets(read);
      setSheetIdx(0);
      const m = autoMap(read[0].rows[0]);
      setMapping(m);
      setShowMapping(m.title === null);
      setOverrides(new Map());
      setPhase("preview");
    } catch (e) {
      setError(e instanceof FileProblem ? e.message : tr("imp.readFail"));
    }
  }

  function pickSheet(i: number) {
    setSheetIdx(i);
    const m = autoMap(sheets[i].rows[0]);
    setMapping(m);
    setShowMapping(m.title === null);
    setOverrides(new Map());
  }

  function setColumn(field: FieldKey, value: string) {
    setMapping((m) => (m ? { ...m, [field]: value === "-1" ? null : Number(value) } : m));
    setOverrides(new Map());
  }

  function toggle(i: number, on: boolean) {
    setOverrides((o) => new Map(o).set(i, on));
  }

  async function create() {
    setPhase("working");
    setProgress({ done: 0, total: chosen.length });
    try {
      const s = await importCases(chosen, {
        useNlp,
        fileName,
        user: user ? { name: user.name, badge: user.badge } : undefined,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setSummary(s);
      setPhase("done");
      onCreated(s);
    } catch {
      setError(tr("imp.failed"));
      setPhase("preview");
    }
  }

  // --- 1. choose a file
  if (phase === "pick") {
    return (
      <div className="flex flex-col gap-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); void handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-10 text-center transition-colors",
            dragActive ? "border-cyan-400 bg-cyan-500/5" : "border-border hover:border-border-strong",
          )}
        >
          <UploadCloud size={26} className="text-cyan-400" />
          <p className="text-sm text-text">{tr("imp.drop")}</p>
          <p className="text-[11px] text-text-muted">{tr("imp.dropHint", { rows: MAX_ROWS })}</p>
          <input ref={inputRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.xlsm" className="hidden" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        {error && <p role="alert" className="flex items-start gap-1.5 text-xs text-red"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-panel-hover/30 p-3 text-xs text-text-secondary">
          <p className="max-w-md">
            {tr("imp.help")}
          </p>
          <Button size="sm" variant="outline" onClick={downloadTemplate}><Download size={13} /> {tr("imp.template")}</Button>
        </div>
      </div>
    );
  }

  // --- 3. working / 4. done
  if (phase === "working") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Loader2 size={26} className="animate-spin text-cyan-400" />
        <p className="text-sm text-text">{tr("imp.creating", { done: progress.done, total: progress.total })}</p>
        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-panel-hover">
          <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
        </div>
      </div>
    );
  }

  if (phase === "done" && summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 size={30} className="text-green" />
        <p className="text-sm font-medium text-text">{trn("imp.doneTitle", summary.cases)}</p>
        <p className="max-w-md text-xs leading-relaxed text-text-secondary">
          {tr("imp.doneSummary", { entities: summary.entities, links: summary.links })}
          {summary.joined > 0 && <> {tr("imp.doneJoined", { n: summary.joined })}</>}
        </p>
        <p className="max-w-md text-[11px] text-text-muted">{tr("imp.doneNote")}</p>
        <Button onClick={onClose}>{tr("imp.showCases")}</Button>
      </div>
    );
  }

  // --- 2. review
  const matched = mapping ? FIELDS.filter((f) => mapping[f.key] !== null).length : 0;
  const errors = built.filter((r) => r.issues.some((i) => i.level === "error")).length;
  const skipped = built.length - chosen.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileSpreadsheet size={16} className="shrink-0 text-cyan-400" />
          <span className="mono truncate text-xs text-text" title={fileName}>{fileName}</span>
          <Badge variant="outline">{trn("imp.rows", built.length)}</Badge>
          {sheet?.truncated && <Badge variant="amber">{tr("imp.truncated", { n: MAX_ROWS })}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {sheets.length > 1 && (
            <Select value={String(sheetIdx)} onValueChange={(v) => pickSheet(Number(v))}>
              <SelectTrigger className="h-8 w-44 text-xs" aria-label={tr("imp.sheetLabel")}><SelectValue /></SelectTrigger>
              <SelectContent>{sheets.map((s, i) => <SelectItem key={i} value={String(i)}>{tr("imp.sheet", { name: s.name })}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button size="sm" variant="ghost" onClick={() => { setPhase("pick"); setError(""); }}>{tr("imp.chooseAnother")}</Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel-hover/30">
        <button type="button" onClick={() => setShowMapping((v) => !v)} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs">
          <span className="text-text-secondary">
            {tr("imp.matched", { n: matched, total: FIELDS.length })}
            {titleMissing && <span className="ml-2 text-red">{tr("imp.needTitle")}</span>}
          </span>
          <span className="flex items-center gap-1 text-cyan-300">{tr("imp.adjust")} <ChevronDown size={13} className={cn("transition-transform", showMapping && "rotate-180")} /></span>
        </button>
        {showMapping && mapping && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border p-3 lg:grid-cols-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <p className="mb-1 text-[11px] text-text-muted">{tr(f.label)}{f.required && <span className="text-red"> *</span>} <span className="text-text-muted/70">· {tr(f.hint)}</span></p>
                <Select value={mapping[f.key] === null ? "-1" : String(mapping[f.key])} onValueChange={(v) => setColumn(f.key, v)}>
                  <SelectTrigger className="h-8 text-xs" aria-label={tr(f.label)}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">{tr("imp.notInFile")}</SelectItem>
                    {headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h ? h.slice(0, 40) : tr("imp.noName", { n: i + 1 })}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      {titleMissing ? (
        <p className="py-8 text-center text-xs text-text-muted">{tr("imp.pickTitle")}</p>
      ) : (
        <>
          <div className="max-h-[38vh] overflow-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="w-10">{tr("imp.col.row")}</TableHead>
                  <TableHead>{tr("common.title")}</TableHead>
                  <TableHead>{tr("imp.f.category")}</TableHead>
                  <TableHead>{tr("common.status")}</TableHead>
                  <TableHead>{tr("imp.f.priority")}</TableHead>
                  <TableHead>{tr("imp.col.yearPlace")}</TableHead>
                  <TableHead>{tr("imp.col.names")}</TableHead>
                  <TableHead>{tr("common.notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {built.map((r, i) => {
                  const blocked = r.title === "";
                  const on = isIncluded(i);
                  return (
                    <TableRow key={i} className={cn(!on && "opacity-55")}>
                      <TableCell>
                        <input type="checkbox" checked={on} disabled={blocked} onChange={(e) => toggle(i, e.target.checked)} aria-label={tr("imp.includeRow", { n: r.line })} className="size-3.5 accent-cyan-500" />
                      </TableCell>
                      <TableCell className="mono text-[11px] text-text-muted">{r.line}</TableCell>
                      <TableCell className="max-w-56 truncate font-medium text-text" title={r.title}>{r.title || <span className="text-text-muted">{tr("imp.noTitleCell")}</span>}</TableCell>
                      <TableCell className="max-w-36 truncate text-text-secondary" title={r.category}>{r.category}</TableCell>
                      <TableCell><Badge variant={r.status === "active" ? "cyan" : r.status === "under_review" ? "amber" : "green"}>{tr(`status.${r.status}`)}</Badge></TableCell>
                      <TableCell><Badge variant={r.priority === "critical" ? "red" : r.priority === "high" ? "orange" : "outline"}>{tr(`prio.${r.priority}`)}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap text-[11px] text-text-secondary">{[r.year, r.place].filter(Boolean).join(" · ") || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-[11px] text-text-secondary">{r.people.length + r.organisations.length > 0 ? tr("imp.namesCell", { p: r.people.length, o: r.organisations.length }) : "—"}</TableCell>
                      <TableCell className="min-w-44 max-w-64">
                        <div className="flex flex-wrap gap-1">
                          {r.issues.map((iss, k) => (
                            <Badge key={k} variant={iss.level === "error" ? "red" : "amber"} title={iss.text}>{iss.text.length > 34 ? `${iss.text.slice(0, 32)}…` : iss.text}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-panel-hover/30 p-3 text-xs text-text-secondary">
            <input type="checkbox" checked={useNlp} onChange={(e) => setUseNlp(e.target.checked)} className="mt-0.5 size-3.5 accent-cyan-500" />
            <span>
              <span className="flex items-center gap-1 text-text"><Sparkles size={12} className="text-cyan-400" /> {tr("imp.nlp.title")}</span>
              {tr("imp.nlp.desc")}
            </span>
          </label>
        </>
      )}

      {error && <p role="alert" className="text-xs text-red">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-text-muted">
          {tr("imp.footer", { n: chosen.length, total: built.length })}{skipped > 0 && ` · ${tr("imp.skipped", { n: skipped })}`}{errors > 0 && ` · ${tr("imp.noTitleCount", { n: errors })}`}. {tr("imp.untick")}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>{tr("common.cancel")}</Button>
          <Button onClick={() => void create()} disabled={chosen.length === 0 || titleMissing}>
            {trn("imp.createN", chosen.length)}
          </Button>
        </div>
      </div>
    </div>
  );
}
