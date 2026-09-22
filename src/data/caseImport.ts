// Turns the rows of a CSV or Excel file into cases (one case per row), optionally with the people and organisations
// named in the row and the ones the NLP engine finds in its description.
import type { CasePriority, CaseRecord, Entity, EntityType, Relationship } from "@/types";
import { analyzeText, type NlpEntity } from "@/nlp/extract";
import { buildEntity, buildRelationship } from "@/nlp/toGraph";
import { allEntities, relationships as graphRelationships, addBulk } from "./store";
import { refreshAlerts } from "./index";
import { tr } from "@/i18n/core";
import { en, type Key } from "@/i18n/en";

export type FieldKey =
  | "title"
  | "description"
  | "category"
  | "status"
  | "priority"
  | "year"
  | "place"
  | "agency"
  | "impact"
  | "outcome"
  | "people"
  | "organisations";

export interface FieldDef {
  key: FieldKey;
  /** Translation keys for the name and the short hint shown in the column picker. */
  label: Key;
  required?: boolean;
  hint: Key;
  /** Header names (lower case, letters and digits only) that are recognised without asking. */
  synonyms: string[];
  /** A looser test used only when no header matched exactly ("FIR Year", "Year of offence"). */
  pattern?: RegExp;
}

export const FIELDS: FieldDef[] = [
  { key: "title", label: "imp.f.title", required: true, hint: "imp.h.title", synonyms: ["title", "casetitle", "casename", "name", "case", "matter", "subject", "caseheading"] },
  { key: "description", label: "imp.f.description", hint: "imp.h.description", synonyms: ["description", "summary", "details", "casesummary", "narrative", "notes", "brief", "facts", "about"] },
  { key: "category", label: "imp.f.category", hint: "imp.h.category", synonyms: ["category", "type", "casetype", "crimetype", "offence", "offense", "kind", "nature", "crime"] },
  { key: "status", label: "imp.f.status", hint: "imp.h.status", synonyms: ["status", "casestatus"] },
  { key: "priority", label: "imp.f.priority", hint: "imp.h.priority", synonyms: ["priority", "severity", "urgency"] },
  { key: "year", label: "imp.f.year", hint: "imp.h.year", synonyms: ["year", "caseyear", "yr", "yearreported", "yearfiled", "date", "dateofoffence", "dateregistered", "registered", "filed", "filingdate", "firdate"], pattern: /year|date/ },
  { key: "place", label: "imp.f.place", hint: "imp.h.place", synonyms: ["place", "location", "city", "district", "area", "region", "state", "placeofoccurrence", "locationofoffence"] },
  { key: "agency", label: "imp.f.agency", hint: "imp.h.agency", synonyms: ["leadagency", "agency", "investigatingagency", "leadagencies", "department", "policestation", "unit", "assignedto", "investigator"] },
  { key: "impact", label: "imp.f.impact", hint: "imp.h.impact", synonyms: ["impact", "amount", "lossamount", "loss", "valueinvolved", "amountinvolved", "scale", "victims", "damage", "fraudamount"] },
  { key: "outcome", label: "imp.f.outcome", hint: "imp.h.outcome", synonyms: ["outcome", "currentstatus", "result", "verdict", "judgment", "disposition", "courtstatus", "statusupdate"] },
  { key: "people", label: "imp.f.people", hint: "imp.h.people", synonyms: ["people", "persons", "person", "accused", "suspects", "suspect", "individuals", "namedpersons", "accusedpersons", "accusedname", "peopleinvolved", "names"] },
  { key: "organisations", label: "imp.f.organisations", hint: "imp.h.organisations", synonyms: ["organisations", "organizations", "organisation", "organization", "companies", "company", "firms", "orgs", "institutions", "businesses"] },
];

/** column index for each field, or null when the file has no such column */
export type Mapping = Record<FieldKey, number | null>;

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Guesses which column is which from the header names. Exact matches first, then headers that contain a known name. */
export function autoMap(headers: string[]): Mapping {
  const h = headers.map(squash);
  const used = new Set<number>();
  const map = Object.fromEntries(FIELDS.map((f) => [f.key, null])) as Mapping;
  for (const f of FIELDS) {
    const i = h.findIndex((x, idx) => !used.has(idx) && f.synonyms.includes(x));
    if (i !== -1) {
      map[f.key] = i;
      used.add(i);
    }
  }
  for (const f of FIELDS) {
    if (map[f.key] !== null) continue;
    const i = h.findIndex((x, idx) => !used.has(idx) && x.length > 0 && (f.synonyms.some((s) => s.length >= 5 && x.includes(s)) || (f.pattern?.test(x) ?? false)));
    if (i !== -1) {
      map[f.key] = i;
      used.add(i);
    }
  }
  return map;
}

// --- reading the rows --------------------------------------------------------------------------------

export interface RowIssue {
  level: "error" | "warn";
  text: string;
}

export interface ImportRow {
  /** Row number in the file, counting the header as row 1. */
  line: number;
  title: string;
  description: string;
  category: string;
  status: CaseRecord["status"];
  priority: CasePriority;
  year?: number;
  place: string;
  agencies: string[];
  impact: string;
  outcome: string;
  people: string[];
  organisations: string[];
  issues: RowIssue[];
  /** Ticked by default: rows with a problem that would make a bad case are not. */
  include: boolean;
}

const STATUS_WORDS: Record<string, CaseRecord["status"]> = {
  active: "active", open: "active", ongoing: "active", "in progress": "active", new: "active", pending: "under_review",
  "under review": "under_review", review: "under_review", "in review": "under_review", "under investigation": "under_review", investigation: "under_review",
  closed: "closed", resolved: "closed", done: "closed", completed: "closed", disposed: "closed", concluded: "closed",
};

const PRIORITY_WORDS: Record<string, CasePriority> = {
  low: "low", minor: "low", medium: "medium", normal: "medium", moderate: "medium", med: "medium",
  high: "high", major: "high", urgent: "high", critical: "critical", severe: "critical", highest: "critical",
};

const LIMITS = { title: 200, short: 200, description: 5000, name: 120, names: 50 };

/** Names are separated by ; | or new lines. If none of those is used, a list like "A, B" is split on commas. */
function splitNames(cell: string): string[] {
  if (!cell) return [];
  let parts = cell.split(/[;|\n]+/);
  if (parts.length === 1 && /,\s/.test(cell)) parts = cell.split(/,\s+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const n = p.replace(/\s+/g, " ").trim().slice(0, LIMITS.name);
    if (n.length < 2 || seen.has(norm(n))) continue;
    seen.add(norm(n));
    out.push(n);
    if (out.length >= LIMITS.names) break;
  }
  return out;
}

/** Turns the data rows (everything after the header) into cases to review. */
export function buildRows(dataRows: string[][], mapping: Mapping, existingTitles: Set<string>): ImportRow[] {
  const seenTitles = new Set<string>();
  const cell = (row: string[], key: FieldKey) => (mapping[key] === null ? "" : (row[mapping[key]!] ?? "").trim());

  return dataRows.map((row, i) => {
    const issues: RowIssue[] = [];
    const warn = (text: string) => issues.push({ level: "warn", text });
    const line = i + 2;

    let title = cell(row, "title");
    if (title.length > LIMITS.title) {
      title = title.slice(0, LIMITS.title);
      warn(tr("imp.issue.titleShort"));
    }
    let include = true;
    if (!title) {
      issues.push({ level: "error", text: tr("imp.issue.noTitle") });
      include = false;
    } else {
      const key = title.toLowerCase();
      if (existingTitles.has(key)) {
        warn(tr("imp.issue.exists"));
        include = false;
      } else if (seenTitles.has(key)) {
        warn(tr("imp.issue.dupRow"));
        include = false;
      }
      seenTitles.add(key);
    }

    const statusText = cell(row, "status");
    let status: CaseRecord["status"] = "active";
    if (statusText) {
      const s = STATUS_WORDS[statusText.toLowerCase().replace(/[_-]+/g, " ")];
      if (s) status = s;
      else warn(tr("imp.issue.status", { v: statusText.slice(0, 30) }));
    }

    const priorityText = cell(row, "priority");
    let priority: CasePriority = "medium";
    if (priorityText) {
      const p = PRIORITY_WORDS[priorityText.toLowerCase()];
      if (p) priority = p;
      else warn(tr("imp.issue.priority", { v: priorityText.slice(0, 30) }));
    }

    const yearText = cell(row, "year");
    let year: number | undefined;
    if (yearText) {
      const m = yearText.match(/\b(1[89]\d\d|20\d\d|2100)\b/);
      if (m) year = Number(m[1]);
      else warn(tr("imp.issue.year", { v: yearText.slice(0, 20) }));
    }

    const description = cell(row, "description");
    return {
      line,
      title,
      description: description.slice(0, LIMITS.description),
      category: cell(row, "category").slice(0, LIMITS.short) || "General Investigation",
      status,
      priority,
      year,
      place: cell(row, "place").slice(0, LIMITS.short),
      agencies: splitNames(cell(row, "agency")).slice(0, 6),
      impact: cell(row, "impact").slice(0, 500),
      outcome: cell(row, "outcome").slice(0, 1000),
      people: splitNames(cell(row, "people")),
      organisations: splitNames(cell(row, "organisations")),
      issues,
      include,
    };
  });
}

// --- making the cases --------------------------------------------------------------------------------

export interface ImportSummary {
  cases: number;
  /** New people, organisations and other entities added to the graph. */
  entities: number;
  /** Links between them found in the descriptions. */
  links: number;
  /** Entities that were already in the graph and are now part of a new case as well. */
  joined: number;
}

// Slightly lower than in the review window (70): nobody ticks names one by one here, and a capitalised two-word name
// with no cue word around it scores 68, which is still almost always a real name in a case summary.
const NEW_ENTITY_MIN_CONFIDENCE = 65;
const NEW_LINK_MIN_CONFIDENCE = 60;

const initialsOf = (s: string) => s.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
const badgeOf = (name: string) => (name.length <= 14 ? name : name.split(/\s+/).map((w) => w[0]).join("").slice(0, 6).toUpperCase());

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Creates one case per row. Rows are processed in small batches so the page stays responsive, and nothing is added to
 * the graph until all of them are done. Names that appear in several rows become one entity that belongs to each case.
 */
export async function importCases(
  rows: ImportRow[],
  opts: { useNlp: boolean; fileName: string; user?: { name: string; badge?: string }; onProgress?: (done: number, total: number) => void },
): Promise<ImportSummary> {
  const stamp = Date.now().toString(36);
  const now = Date.now();
  const year = new Date().getFullYear();

  const newCases: CaseRecord[] = [];
  const created: Entity[] = [];
  const newRels: Relationship[] = [];
  const touches = new Map<string, Set<string>>();
  const byId = new Map<string, Entity>(allEntities.map((e) => [e.id, e]));
  const index = new Map<string, Entity>();
  const keyOf = (type: EntityType, name: string) => `${type}:${norm(name)}`;
  for (const e of allEntities) {
    if (e.type === "person") for (const n of [e.name, ...e.aliases]) index.set(keyOf("person", n), e);
    else if (e.type === "organization" || e.type === "location") index.set(keyOf(e.type, e.name), e);
  }
  let entityCounter = 0;
  let linkCounter = 0;

  const belong = (ent: Entity, caseId: string) => {
    if (created.includes(ent)) {
      if (!ent.caseIds.includes(caseId)) ent.caseIds.push(caseId);
    } else {
      const set = touches.get(ent.id) ?? new Set<string>();
      set.add(caseId);
      touches.set(ent.id, set);
    }
  };
  const makeEntity = (nl: NlpEntity, caseId: string, source: string, origin: "nlp" | "list") => {
    const ent = buildEntity(nl, `imp-${stamp}-${entityCounter++}`, caseId, source, origin);
    created.push(ent);
    byId.set(ent.id, ent);
    index.set(keyOf(ent.type, ent.name), ent);
    return ent;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const caseId = `case-${row.year ?? year}-${stamp}${i.toString(36)}`;
    const source = `${opts.fileName} (row ${row.line})`;
    newCases.push({
      id: caseId,
      title: row.title,
      category: row.category,
      status: row.status,
      priority: row.priority,
      description: row.description,
      year: row.year ?? year,
      place: row.place || undefined,
      impact: row.impact || undefined,
      outcome: row.outcome || undefined,
      entityIds: [],
      assignedInvestigators:
        row.agencies.length > 0
          ? row.agencies.map((a) => ({ name: a, badge: badgeOf(a), initials: initialsOf(a) }))
          : opts.user
            ? [{ name: opts.user.name, badge: opts.user.badge || "YOU", initials: initialsOf(opts.user.name) }]
            : [],
      // the first row is the newest, so the list keeps the order of the file
      createdAt: new Date(now - i).toISOString(),
      updatedAt: new Date(now - i).toISOString(),
    });

    // names listed in their own columns
    const listed: { type: "person" | "organization"; name: string }[] = [
      ...row.people.map((name) => ({ type: "person" as const, name })),
      ...row.organisations.map((name) => ({ type: "organization" as const, name })),
    ];
    for (const { type, name } of listed) {
      const found = index.get(keyOf(type, name));
      if (found) belong(found, caseId);
      else makeEntity({ key: keyOf(type, name), label: name, type, confidence: 100, mentions: [], aliases: [], tags: [] }, caseId, source, "list");
    }

    // names found in the description
    if (opts.useNlp && row.description.length >= 20) {
      const r = analyzeText(row.description, [...allEntities, ...created], [...graphRelationships, ...newRels]);
      const idFor = new Map<string, string>();
      for (const e of r.entities) {
        let ent: Entity | undefined = e.entityId ? byId.get(e.entityId) : undefined;
        if (!ent && e.confidence >= NEW_ENTITY_MIN_CONFIDENCE) ent = index.get(keyOf(e.type, e.label));
        if (ent) belong(ent, caseId);
        else if (e.confidence >= NEW_ENTITY_MIN_CONFIDENCE) ent = makeEntity(e, caseId, source, "nlp");
        if (ent) idFor.set(e.key, ent.id);
      }
      for (const rel of r.relationships) {
        if (rel.existing || rel.confidence < NEW_LINK_MIN_CONFIDENCE) continue;
        const s = idFor.get(rel.sourceKey);
        const t = idFor.get(rel.targetKey);
        if (s && t && s !== t) newRels.push(buildRelationship(rel, `imp-r-${stamp}-${linkCounter++}`, s, t, caseId, source));
      }
    }

    if (i % 10 === 9) {
      opts.onProgress?.(i + 1, rows.length);
      await tick();
    }
  }

  addBulk(newCases, created, newRels, new Map([...touches].map(([id, set]) => [id, [...set]])));
  refreshAlerts();
  opts.onProgress?.(rows.length, rows.length);
  return { cases: newCases.length, entities: created.length, links: newRels.length, joined: touches.size };
}

// --- a template people can start from ------------------------------------------------------------------

const csvCell = (s: string) => (/[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** A CSV with the column names this feature understands and two clearly made-up example rows. */
export function templateCsv(): string {
  // the template always has English headers, because those are the names the column matching knows
  const header = FIELDS.map((f) => en[f.label]);
  const rows = [
    [
      "SAMPLE: Deposit scheme fraud, Kolkata",
      "SAMPLE (made-up): The Sunrise Deposit Scheme Pvt. Ltd. collected money from small investors in Kolkata by promising high returns. Rohan Verma, its director, transferred Rs 40 crore to Meera Iyer, who runs Lotus Traders Pvt. Ltd.",
      "Financial fraud",
      "active",
      "high",
      "2024",
      "Kolkata, West Bengal",
      "EOW Kolkata; CBI",
      "About Rs 40 crore from 3,000 investors",
      "Charge sheet pending",
      "Rohan Verma; Meera Iyer",
      "Sunrise Deposit Scheme Pvt. Ltd.; Lotus Traders Pvt. Ltd.",
    ],
    [
      "SAMPLE: Cross-border narcotics module, Punjab",
      "SAMPLE (made-up): Acting on credible information, police arrested Imran Sheikh near Amritsar with 4 kg of heroin. Sheikh, the son of Abdul Sheikh, was in phone contact with Vikas Pandey.",
      "Narcotics (NDPS Act)",
      "under review",
      "critical",
      "2025",
      "Amritsar, Punjab",
      "Punjab Police",
      "4 kg heroin seized",
      "",
      "Imran Sheikh; Vikas Pandey",
      "",
    ],
  ];
  return "\uFEFF" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
