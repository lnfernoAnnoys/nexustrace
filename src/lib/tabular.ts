// Reads a CSV or Excel file into rows of text. Runs in the browser; the file is never uploaded.

import { tr } from "@/i18n/core";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 500;

export interface Sheet {
  name: string;
  /** Every row, header first; all cells are trimmed text and every row has the same width. */
  rows: string[][];
  /** More rows were in the file than the limit allows. */
  truncated: boolean;
}

export class FileProblem extends Error {}

// --- CSV ---------------------------------------------------------------------------------------------

function detectDelimiter(text: string): string {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim()).slice(0, 6);
  let best = ",";
  let bestScore = 0;
  for (const d of [",", ";", "\t", "|"]) {
    // count the delimiter outside quotes on each line; a good delimiter appears the same number of times on every line
    const counts = lines.map((l) => {
      let n = 0;
      let inQ = false;
      for (const ch of l) {
        if (ch === '"') inQ = !inQ;
        else if (ch === d && !inQ) n++;
      }
      return n;
    });
    const first = counts[0] ?? 0;
    if (first === 0) continue;
    const score = counts.filter((c) => c === first).length * 1000 + first;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** Parses CSV text (quoted fields, "" escapes, commas or semicolons or tabs, any line ending). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// --- shared clean-up ---------------------------------------------------------------------------------

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v).replace(/\s+/g, " ").trim();
}

/** Drops empty rows, makes every row the same width, and applies the row limit. */
function tidy(raw: unknown[][]): { rows: string[][]; truncated: boolean } {
  const rows = raw.map((r) => r.map(cellText)).filter((r) => r.some((c) => c !== ""));
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const padded = rows.map((r) => [...r, ...Array<string>(width - r.length).fill("")]);
  const truncated = padded.length > MAX_ROWS + 1;
  return { rows: truncated ? padded.slice(0, MAX_ROWS + 1) : padded, truncated };
}

// --- files -------------------------------------------------------------------------------------------

function decodeText(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // CSV saved by older Excel versions is often Windows-1252, not UTF-8
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Reads every sheet of a .csv, .tsv, .txt or .xlsx file. Throws FileProblem with a message for the person. */
export async function readTableFile(file: File): Promise<Sheet[]> {
  if (file.size === 0) throw new FileProblem(tr("imp.err.empty"));
  if (file.size > MAX_FILE_BYTES) throw new FileProblem(tr("imp.err.tooBig", { mb: MAX_FILE_BYTES / 1024 / 1024 }));
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const bytes = await file.arrayBuffer();

  if (ext === "xls") throw new FileProblem(tr("imp.err.xls"));
  if (ext === "xlsx" || ext === "xlsm") {
    const head = new Uint8Array(bytes.slice(0, 4));
    if (!(head[0] === 0x50 && head[1] === 0x4b)) throw new FileProblem(tr("imp.err.fakeXlsx"));
    let sheets: { sheet: string; data: unknown[][] }[];
    try {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      sheets = (await readXlsxFile(bytes)) as unknown as { sheet: string; data: unknown[][] }[];
    } catch {
      throw new FileProblem(tr("imp.err.xlsxBroken"));
    }
    const out = sheets.map((s) => ({ name: s.sheet, ...tidy(s.data) })).filter((s) => s.rows.length > 0);
    if (out.length === 0) throw new FileProblem(tr("imp.err.noSheetData"));
    return out;
  }
  if (ext === "csv" || ext === "tsv" || ext === "txt" || ext === "") {
    const text = decodeText(bytes);
    if (text.includes("\u0000")) throw new FileProblem(tr("imp.err.binary"));
    const t = tidy(parseCsv(text));
    if (t.rows.length === 0) throw new FileProblem(tr("imp.err.noData"));
    return [{ name: "CSV", ...t }];
  }
  throw new FileProblem(tr("imp.err.unsupported", { ext }));
}
