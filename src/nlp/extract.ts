// Rule-based NLP for police case text. No network, no model download: it runs in the browser or in Node in
// a few milliseconds. It does four jobs:
//   1. Entity recognition: people, places, organisations, phone numbers, vehicles, bank accounts.
//   2. Entity linking: matches what it finds against the people/places already in the graph.
//   3. Relationship extraction: reads the verbs and phrases between two entities ("transferred", "son of",
//      "registered in the name of"...) and turns them into graph links.
//   4. Case facts: amounts, dates, legal sections and the kind of crime described.
import type { Entity, EntityType, Relationship, RelationshipType } from "@/types";
import {
  ACT_CATEGORY,
  AGENCIES,
  BANKS,
  CITIES,
  CRIME_KEYWORDS,
  NUMBERED_PLACE,
  OFFICIAL_TITLES,
  ORG_SUFFIX,
  PERSON_TITLES,
  PLACE_SUFFIX,
  RTO_CODES,
  SECTION_CATEGORY,
  STATES,
  STOP_WORDS,
  VEHICLE_WORDS,
} from "./lexicon";
import { extractHandles, type HandleHit } from "./handles";

export type EntityRole = "official" | "agency" | "institution";
export type PersonTag = "accused" | "victim" | "witness";

export interface Mention {
  start: number;
  end: number;
}

export interface NlpEntity {
  key: string;
  label: string;
  type: EntityType;
  confidence: number; // 0-100
  mentions: Mention[];
  aliases: string[];
  tags: PersonTag[];
  /** Officials, agencies and banks are recognised but kept out of the network. */
  role?: EntityRole;
  /** Set when this matches an entity that is already in the graph. */
  entityId?: string;
  matchScore?: number;
}

export interface NlpRelationship {
  id: string;
  type: RelationshipType;
  sourceKey: string;
  targetKey: string;
  sourceLabel: string;
  targetLabel: string;
  label: string;
  cue: string;
  confidence: number;
  strength: number;
  evidence: string;
  frequency: number;
  /** Both ends are in the graph and already linked. */
  existing: boolean;
}

export interface NlpFact {
  kind: "amount" | "date" | "section" | "ifsc" | "handle";
  text: string;
}

export interface NlpResult {
  entities: NlpEntity[];
  /** Officials, agencies and banks mentioned in the text (not added to the network). */
  excluded: NlpEntity[];
  relationships: NlpRelationship[];
  crimes: { category: string; evidence: string }[];
  facts: NlpFact[];
  /** Social media handles and profile links written in the text. */
  handles: HandleHit[];
  stats: { chars: number; sentences: number; ms: number };
}

// ---------------------------------------------------------------------------------------------
// small helpers

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

interface Tok {
  text: string;
  start: number;
  end: number;
  sent: number;
}

interface SentenceSpan {
  start: number;
  end: number;
}

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "shri", "smt", "sh", "no", "nos", "sec", "st", "rs", "vs", "insp", "inspr", "addl",
  "asst", "dy", "sr", "jr", "co", "ltd", "pvt", "prof", "gen", "col", "capt", "lt", "sgt", "dept", "govt",
  "approx", "etc", "viz", "dt", "ref", "cr", "km", "sri",
]);

const COMPANY_ABBR = new Set(["ltd", "co", "inc", "corp", "llp", "pvt"]);
const SENTENCE_STARTERS = new Set(["The", "A", "An", "He", "She", "It", "They", "This", "That", "These", "Those", "In", "On", "At", "During", "After", "Before", "Police", "Accused", "Case", "Further", "Subsequently", "However", "Meanwhile", "Later", "Also", "His", "Her", "Their", "When", "While", "As", "Following", "Investigation", "According"]);

function splitSentences(text: string): SentenceSpan[] {
  const spans: SentenceSpan[] = [];
  let start = 0;
  const re = /[.!?]+["”')\]]*\s+(?=["“(]?[A-Z0-9₹])|\n\s*\n|\n(?=\s*(?:[-•*]|\d+[.)])\s)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(start, m.index);
    const lastWord = before.match(/([A-Za-z]+)$/)?.[1] ?? "";
    const isInitial = /(?:^|[\s(])[A-Z]$/.test(before);
    let isAbbr = m[0].startsWith(".") && (ABBREVIATIONS.has(lastWord.toLowerCase()) || isInitial);
    if (isAbbr && COMPANY_ABBR.has(lastWord.toLowerCase())) {
      const nextWord = text.slice(m.index + m[0].length).match(/^[A-Za-z]+/)?.[0] ?? "";
      if (SENTENCE_STARTERS.has(nextWord)) isAbbr = false;
    }
    if (isAbbr) continue;
    const end = m.index + (m[0].startsWith("\n") ? 0 : m[0].trimEnd().length);
    if (end > start) spans.push({ start, end });
    start = m.index + m[0].length;
  }
  if (start < text.length) spans.push({ start, end: text.length });
  return spans.filter((s) => text.slice(s.start, s.end).trim().length > 0);
}

function tokenize(text: string, sentences: SentenceSpan[]): Tok[] {
  const toks: Tok[] = [];
  const re = /[A-Za-z][A-Za-z'’-]*|\d+[A-Za-z]*|[.,;:()&@/₹!?]/g;
  let m: RegExpExecArray | null;
  let s = 0;
  while ((m = re.exec(text))) {
    while (s < sentences.length - 1 && m.index >= sentences[s].end) s++;
    toks.push({ text: m[0], start: m.index, end: m.index + m[0].length, sent: s });
  }
  return toks;
}

function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (!la || !lb) return 0;
  const range = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const am = new Array<boolean>(la).fill(false);
  const bm = new Array<boolean>(lb).fill(false);
  let matches = 0;
  for (let i = 0; i < la; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(lb - 1, i + range);
    for (let j = lo; j <= hi; j++) {
      if (!bm[j] && a[i] === b[j]) {
        am[i] = bm[j] = true;
        matches++;
        break;
      }
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < la; i++) {
    if (!am[i]) continue;
    while (!bm[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / la + matches / lb + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  while (prefix < 4 && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

// ---------------------------------------------------------------------------------------------
// prepared lookups (built once)

const GAZETTEER = new Map<string, "city" | "state">();
for (const s of STATES) GAZETTEER.set(s.toLowerCase(), "state");
for (const c of CITIES) if (!GAZETTEER.has(c.toLowerCase())) GAZETTEER.set(c.toLowerCase(), "city");
const GAZETTEER_WORDS = new Set([...GAZETTEER.keys()].flatMap((k) => k.split(" ")));

const AGENCY_RE = new RegExp(
  "(?<![A-Za-z])(" +
    [...AGENCIES].sort((a, b) => b.length - a.length).map(escapeRe).join("|") +
    ")(?![A-Za-z])",
  "g",
);
const POLICE_RE = /\b(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s+Police(?:\s+Station|\s+Commissionerate)?|Police\s+Station|[A-Z][a-z]+\s+P\.?S\.?)\b/g;
const OFFICIAL_RE = new RegExp(
  "\\b(" +
    [...OFFICIAL_TITLES].sort((a, b) => b.length - a.length).map(escapeRe).join("|") +
    ")\\.?\\s+((?:[A-Z]\\.\\s?){0,3}[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,2}|[A-Z]{2,}(?:\\s+[A-Z]{2,}){0,2})",
  "g",
);
const BANK_RE = new RegExp(
  "(?<![A-Za-z])(" + [...BANKS].sort((a, b) => b.length - a.length).map(escapeRe).join("|") + ")(?![A-Za-z])",
);

const PERSON_CUE_BEFORE_RE =
  /(?:accused|arrested|apprehended|suspects?|absconding|named|namely|alias|aka|urf|co-?accused|associate|aide|kingpin|mastermind|gangster|smuggler|peddler|dealer|operative|handler|accomplice|conspirator|shri|smt|mr|mrs|ms|dr|s\/o|d\/o|w\/o|c\/o|son of|daughter of|wife of|husband of|brother of|sister of|father of|mother of|one|by|complainant|victim|informant|witness|believed to be|identified as|confirmed as|said to be|known as|kingpin|mastermind)\.?\s*[:,-]?\s*(?:(?:shri|smt|mr|mrs|ms|dr|sh)\.?\s+)?$/i;
const PERSON_CUE_AFTER_RE =
  /^\s*(?:,\s*)?(?:\(?\s*(?:alias|aka|a\.k\.a\.?|urf)\b|@|s\/o|d\/o|w\/o|son of|daughter of|wife of|r\/o|resident of|aged\b|age\b|\d{1,2}\s*(?:years|yrs)|was arrested|were arrested|has been arrested|is absconding|was seen|was booked)/i;
const ACCUSED_TAG_RE = /(?:accused|arrested|apprehended|suspects?|absconding|booked|co-?accused|kingpin|mastermind|gangster|smuggler|peddler|operative|conspirator|accomplice)\b/i;
const VICTIM_TAG_RE = /(?:victims?|complainants?|deceased|injured|defrauded|cheated|duped)\b/i;
const WITNESS_TAG_RE = /(?:informants?|witness(?:es)?|eyewitness|source)\b/i;

// ---------------------------------------------------------------------------------------------
// relationship cues

interface Rule {
  type: RelationshipType;
  re: RegExp;
  base: number;
  phrase: string;
}

const RULES: Record<string, Rule> = {
  family: {
    type: "family",
    re: /\b(son of|s\/o|daughter of|d\/o|wife of|w\/o|husband of|brother(?:-in-law)?|sister(?:-in-law)?|father|mother|uncle|nephew|niece|cousins?|in-laws?|relatives?|spouse|married to|wife|husband|son|daughter)\b/,
    base: 86,
    phrase: "is related to",
  },
  financial: {
    type: "financial_transaction",
    re: /\b(transfer(?:red|s|ring)?|remit(?:ted|s|tance|tances)?|deposit(?:ed|s)?|paid|pays?|payments?|received|receives?|sent|wired|credited|debited|withdr[ae]w\w*|funds?|siphon\w*|routed|layered|bribe[sd]?|loan(?:ed|s)?|transactions?|invested|swindled|extorted)\b/,
    base: 80,
    phrase: "transacted with",
  },
  vehicle: {
    type: "vehicle_ownership",
    re: /\b(regist(?:ered|ration)|owned|owner|owns|belong(?:s|ing)?|using|used|uses|driving|driven|drove|travell?ing|car|vehicle|bike|truck|scorpio|swift|innova)\b/,
    base: 82,
    phrase: "is linked to vehicle",
  },
  call: {
    type: "call",
    re: /\b(call(?:ed|s|ing)?|phon(?:ed|es|ing)|spoke|spoken|speaks?|dialled|dialed|conversation|conversed|contacted|rang|telephon\w*|contact(?:ed|s|ing)?|cdr)\b/,
    base: 78,
    phrase: "was in phone contact with",
  },
  sms: {
    type: "sms",
    re: /\b(sms|texted?|messag(?:ed|es|ing)|whatsapp|telegram|chat(?:ted|s)?|emails?|emailed)\b/,
    base: 74,
    phrase: "exchanged messages with",
  },
  business: {
    type: "business",
    re: /\b(director|partner|proprietor|owner|owns|runs|ran|founder|employee|employed|works? (?:for|at|with)|worked|promoter|managing|manager|ceo|shareholder|front|shell|firm|company|business|subsidiary|associated with|operat(?:es|ed|ing)|sell(?:s|ing)? (?:it )?through|sold through|operates? through|bank account|account holder|held by|holder)\b/,
    base: 76,
    phrase: "has a business link with",
  },
  meeting: {
    type: "co_location",
    re: /\b(met|meet(?:ing|s)?|meeting between|seen (?:with|together)|spotted (?:with|together)|gathered|arrived together|rendezvous)\b/,
    base: 72,
    phrase: "met",
  },
  place: {
    type: "co_location",
    re: /\b(present|parked|located|based|stayed|hideout|resident of|r\/o|resides?|lives?|lived|living|found|arrested (?:from|at)|raided)\b/,
    base: 72,
    phrase: "was present at",
  },
  association: {
    type: "association",
    re: /\b(coordinat\w+|associate[sd]?|aide|accomplice|conspir\w+|along with|together with|accompanied|acquaint\w*|kingpin|henchm[ae]n|close to|known to|worked? together|gang|module|syndicate|co-?accused|masterminded|led by|headed by|part of|members? of|linked|connected|nexus|involved|abett\w+|harbou?r\w*|suppl(?:ied|ies|ier)|procur\w+|delivered|handed|sold|bought|purchased|collaborat\w+|helped|assist\w+|colluded|hand in glove)\b/,
    base: 68,
    phrase: "is associated with",
  },
};

const STRENGTH: Record<RelationshipType, number> = {
  family: 8,
  financial_transaction: 7,
  vehicle_ownership: 7,
  business: 6,
  call: 5,
  sms: 4,
  co_location: 4,
  association: 4,
};

function orderFor(a: EntityType, b: EntityType): string[] {
  const pair = [a, b].sort().join("+");
  switch (pair) {
    case "person+person":
      return ["family", "financial", "call", "sms", "meeting", "association"];
    case "organization+person":
      return ["business", "financial", "association"];
    case "organization+organization":
      return ["financial", "business", "association"];
    case "financial_account+financial_account":
      return ["financial"];
    case "financial_account+person":
    case "financial_account+organization":
      return ["business", "financial"];
    case "person+vehicle":
    case "organization+vehicle":
      return ["vehicle"];
    case "person+phone":
    case "organization+phone":
      return ["call", "sms", "association"];
    case "phone+phone":
      return ["call", "sms"];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------------------------
// the analyser

/**
 * The other ways a name already in the graph is written in reports: "Union Carbide India Limited (UCIL)" is also
 * "UCIL", "Union Carbide India Ltd" and "Union Carbide India"; "Kingfisher House, Vile Parle" is "Kingfisher House".
 */
function nameVariants(name: string, type: EntityType): string[] {
  if (type !== "organization" && type !== "location") return [name];
  const out = new Set<string>([name]);
  const noParen = name.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  out.add(noParen);
  const paren = name.match(/\(([^)]+)\)/)?.[1]?.trim();
  if (paren && /^[A-Z][A-Z0-9&.-]{1,7}$/.test(paren)) out.add(paren);
  if (type === "location" && noParen.includes(",")) out.add(noParen.split(",")[0].trim());
  for (const v of [...out]) {
    if (/\bLtd\.?$/i.test(v)) out.add(v.replace(/\bLtd\.?$/i, "Limited"));
    if (/\bLimited$/i.test(v)) out.add(v.replace(/\bLimited$/i, "Ltd"));
    if (/\bPvt\.?\b/i.test(v)) out.add(v.replace(/\bPvt\.?\b/i, "Private"));
  }
  if (type === "organization") {
    for (const v of [...out]) {
      const stripped = v.replace(/\s+(?:Ltd\.?|Limited|Pvt\.?|Private|LLP|Inc\.?|Corporation|Corp\.?|Company)$/i, "").trim();
      if (stripped !== v && stripped.split(" ").length >= 2) out.add(stripped);
    }
  }
  return [...out].filter((v) => v.length >= 3);
}

export function analyzeText(text: string, known: Entity[] = [], existingRels: Relationship[] = []): NlpResult {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const sentences = splitSentences(text);
  const toks = tokenize(text, sentences);
  const mask = new Uint8Array(text.length + 1);

  const found = new Map<string, NlpEntity>();

  const isFree = (s: number, e: number) => {
    for (let i = s; i < e; i++) if (mask[i]) return false;
    return true;
  };
  const take = (s: number, e: number) => mask.fill(1, s, e);

  // social media handles are read first so that "@PNBIndia" or "x.com/thevijaymallya" are not mistaken for names
  const handles = extractHandles(text);
  for (const h of handles) take(h.start, h.end);

  function add(
    type: EntityType,
    label: string,
    start: number,
    end: number,
    confidence: number,
    extra: { key?: string; entityId?: string; role?: EntityRole; tags?: PersonTag[]; aliases?: string[] } = {},
  ): NlpEntity {
    const key = extra.key ?? `${type}:${norm(label)}`;
    let e = found.get(key);
    if (!e) {
      e = { key, label, type, confidence, mentions: [], aliases: [], tags: [], role: extra.role, entityId: extra.entityId };
      found.set(key, e);
    } else {
      e.confidence = Math.max(e.confidence, confidence);
      if (label.length > e.label.length && !e.entityId) e.label = label;
    }
    e.mentions.push({ start, end });
    for (const a of extra.aliases ?? []) if (!e.aliases.includes(a)) e.aliases.push(a);
    for (const t of extra.tags ?? []) if (!e.tags.includes(t)) e.tags.push(t);
    take(start, end);
    return e;
  }

  // ---- 1. entities that are already in the graph (found by name, even if the grammar rules would miss them)
  const byName = new Map<string, Entity>();
  const byPhone = new Map<string, Entity>();
  const byPlate = new Map<string, Entity>();
  const byAccount = new Map<string, Entity>();
  const nameList: string[] = [];
  for (const e of known) {
    if (e.type === "phone") {
      byPhone.set(e.number.replace(/\D/g, "").slice(-10), e);
    } else if (e.type === "vehicle") {
      byPlate.set(e.plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase(), e);
    } else if (e.type === "financial_account") {
      const digits = (e.accountNumber || e.name).replace(/\D/g, "");
      if (digits.length >= 3) byAccount.set(digits.slice(-4), e);
    } else {
      const names = [...nameVariants(e.name, e.type), ...(e.type === "person" ? e.aliases : [])];
      for (const n of names) {
        const nn = n.trim();
        if (nn.length < 3) continue;
        const k = norm(nn);
        if (!byName.has(k)) {
          byName.set(k, e);
          nameList.push(nn);
        }
      }
    }
  }
  if (nameList.length) {
    nameList.sort((a, b) => b.length - a.length);
    for (let i = 0; i < nameList.length; i += 300) {
      const chunk = nameList.slice(i, i + 300).map((n) => escapeRe(n).replace(/\\?\s+/g, "\\s+"));
      const re = new RegExp("(?<![A-Za-z0-9])(" + chunk.join("|") + ")(?![A-Za-z0-9])", "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const ent = byName.get(norm(m[1]));
        if (!ent || !isFree(m.index, m.index + m[1].length)) continue;
        add(ent.type, ent.name, m.index, m.index + m[1].length, 97, { key: `k:${ent.id}`, entityId: ent.id });
      }
    }
  }

  // ---- 2. identifiers with a fixed shape: phone numbers, vehicle plates, bank accounts
  const accountCue = /(?:a\/c|acct|account)\W*(?:no\.?|number|#)?\W*$/i;
  const phoneRe = /(?<![\d])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?![\d])/g;
  let m: RegExpExecArray | null;
  while ((m = phoneRe.exec(text))) {
    const s = m.index;
    const e = s + m[0].length;
    if (!isFree(s, e) || accountCue.test(text.slice(Math.max(0, s - 24), s))) continue;
    const digits = m[0].replace(/\D/g, "").slice(-10);
    const ent = byPhone.get(digits);
    add("phone", `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, s, e, 97, {
      key: ent ? `k:${ent.id}` : `phone:${digits}`,
      entityId: ent?.id,
    });
  }

  const plateRe = /\b([A-Z]{2})[\s-]?(\d{1,2})[\s-]?([A-Z]{1,3})[\s-]?(\d{4})\b/g;
  while ((m = plateRe.exec(text))) {
    if (!RTO_CODES.has(m[1])) continue;
    const s = m.index;
    const e = s + m[0].length;
    if (!isFree(s, e)) continue;
    const plate = `${m[1]}-${m[2].padStart(2, "0")}-${m[3]}-${m[4]}`;
    const ent = byPlate.get((m[1] + m[2] + m[3] + m[4]).toUpperCase()) ?? byPlate.get((m[1] + m[2].padStart(2, "0") + m[3] + m[4]).toUpperCase());
    add("vehicle", plate, s, e, 96, { key: ent ? `k:${ent.id}` : `vehicle:${plate}`, entityId: ent?.id });
  }

  const accountRe = /(?:[Xx*•●]{3,}[\s-]?\d{3,6}|\b(?:a\/c|acct|account)\W*(?:no\.?|number|#)?\W*(\d{9,18})\b)/gi;
  while ((m = accountRe.exec(text))) {
    const s = m.index;
    const e = s + m[0].length;
    if (!isFree(s, e)) continue;
    const digits = (m[1] ?? m[0]).replace(/\D/g, "");
    const last4 = digits.slice(-4);
    const around = text.slice(Math.max(0, s - 50), s) + " " + text.slice(e, e + 20);
    const bank = around.match(BANK_RE)?.[1];
    const ent = byAccount.get(last4);
    const label = `${bank ?? "A/c"} •••${last4}`;
    // the span is just the number, so that the bank name (found separately) is not swallowed
    const numStart = m[1] ? s + m[0].lastIndexOf(m[1]) : s;
    add("financial_account", label, numStart, e, 93, {
      key: ent ? `k:${ent.id}` : `financial_account:${(bank ?? "").toLowerCase()}:${last4}`,
      entityId: ent?.id,
    });
  }

  // ---- 3. officials, investigating agencies and courts (recognised, but not part of the network)
  let am: RegExpExecArray | null;
  OFFICIAL_RE.lastIndex = 0;
  while ((am = OFFICIAL_RE.exec(text))) {
    const s = am.index;
    const e = s + am[0].length;
    if (!isFree(s, e)) continue;
    add("person", am[2].trim(), s, e, 90, { role: "official", key: `official:${norm(am[2])}` });
  }
  POLICE_RE.lastIndex = 0;
  while ((am = POLICE_RE.exec(text))) {
    const s = am.index;
    const e = s + am[0].length;
    if (!isFree(s, e)) continue;
    add("organization", am[0].trim(), s, e, 90, { role: "agency", key: `agency:${norm(am[0])}` });
  }
  AGENCY_RE.lastIndex = 0;
  while ((am = AGENCY_RE.exec(text))) {
    const s = am.index;
    const e = s + am[1].length;
    if (!isFree(s, e)) continue;
    // short acronyms must be upper case ("ED" but not "ed"); the regex is case-sensitive so this always holds
    add("organization", am[1], s, e, 92, { role: "agency", key: `agency:${norm(am[1])}` });
  }

  // ---- 4. organisations: a run of capitalised words that ends in "Traders", "Pvt Ltd", "Bank", "Gang" ...
  const isCapTok = (t: Tok) => /^[A-Z]/.test(t.text);
  const lower = (t: Tok) => t.text.toLowerCase();
  const gap = (a: Tok, b: Tok) => text.slice(a.end, b.start);
  const spaced = (a: Tok, b: Tok) => a.sent === b.sent && /^[ \t]+$/.test(gap(a, b));
  const orgWord = (t: Tok) => isCapTok(t) && isFree(t.start, t.end) && (!STOP_WORDS.has(t.text) || ORG_SUFFIX.has(lower(t)));
  const isSuffix = (t: Tok) => ORG_SUFFIX.has(lower(t));
  const GANG_WORDS = new Set(["gang", "syndicate", "cartel", "module", "network", "group"]);

  for (let i = 0; i < toks.length; i++) {
    if (!orgWord(toks[i])) continue;
    let j = i;
    for (;;) {
      const cur = toks[j];
      const nx = toks[j + 1];
      if (!nx || nx.sent !== cur.sent) break;
      const g = gap(cur, nx);
      if (orgWord(nx) && spaced(cur, nx)) j += 1; // next capitalised word
      else if (nx.text === "." && g === "" && toks[j + 2] && spaced(nx, toks[j + 2]) && orgWord(toks[j + 2])) j += 2; // "Pvt. Ltd."
      else if (nx.text === "." && g === "" && /^(ltd|co|pvt|corp)$/i.test(cur.text)) j += 1; // trailing "Ltd."
      else if (nx.text === "&" && spaced(cur, nx) && toks[j + 2] && spaced(nx, toks[j + 2]) && orgWord(toks[j + 2])) j += 2; // "Bullion & Forex"
      else break;
    }
    // the organisation ends at the last suffix word in the run (never the first word of the run)
    let endIdx = -1;
    for (let k = j; k > i; k--) {
      if (toks[k].text !== "." && toks[k].text !== "&" && isSuffix(toks[k])) {
        endIdx = k;
        break;
      }
    }
    // "Bishnoi gang": a lowercase group word right after a capitalised name
    if (endIdx === -1) {
      const nx = toks[j + 1];
      if (nx && GANG_WORDS.has(lower(nx)) && spaced(toks[j], nx) && !STOP_WORDS.has(toks[j].text)) endIdx = j + 1;
    }
    if (endIdx === -1) {
      i = j;
      continue;
    }
    let startIdx = i;
    while (startIdx < endIdx && STOP_WORDS.has(toks[startIdx].text) && !isSuffix(toks[startIdx])) startIdx++;
    if (startIdx >= endIdx) {
      i = j;
      continue;
    }
    const s = toks[startIdx].start;
    const dot = toks[endIdx + 1];
    const e = toks[endIdx].end + (dot?.text === "." && dot.start === toks[endIdx].end && /^(ltd|co|pvt|corp)$/i.test(toks[endIdx].text) ? 1 : 0);
    if (isFree(s, e)) {
      const label = text.slice(s, e).replace(/\s+/g, " ");
      const isBank = /\bBank$/.test(label) || BANK_RE.test(label);
      add("organization", label, s, e, isBank ? 90 : 84, { role: isBank ? "institution" : undefined });
    }
    i = Math.max(endIdx, i);
  }
  // ---- 5. places: gazetteer cities/states, "Sector 21", "Ashoka Enclave", joined with commas into one address
  interface Seg {
    start: number;
    end: number;
    kind: "city" | "state" | "numbered" | "suffix";
    firstTok: number;
    lastTok: number;
  }
  const segs: Seg[] = [];
  const adjacent = (a: Tok, b: Tok) => a.sent === b.sent && /^[ \t]+$/.test(gap(a, b));
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (!isFree(t.start, t.end)) continue;
    // gazetteer (longest first: up to 3 words)
    let matched = false;
    for (let n = 3; n >= 1 && !matched; n--) {
      if (i + n > toks.length) continue;
      let ok = true;
      for (let k = i; k < i + n - 1; k++) if (!adjacent(toks[k], toks[k + 1])) ok = false;
      if (!ok) continue;
      const words = toks.slice(i, i + n).map((x) => x.text);
      if (!words.every((w) => /^[A-Za-z]+$/.test(w))) continue;
      const phrase = words.join(" ").toLowerCase();
      const kind = GAZETTEER.get(phrase);
      // one-word names must be capitalised ("Delhi", not "delhi"); "NCR" is fine
      if (kind && /^[A-Z]/.test(words[0]) && isFree(t.start, toks[i + n - 1].end)) {
        segs.push({ start: t.start, end: toks[i + n - 1].end, kind, firstTok: i, lastTok: i + n - 1 });
        i += n - 1;
        matched = true;
      }
    }
    if (matched) continue;
    // "Sector 21", "Plot 14"
    if (NUMBERED_PLACE.has(lower(t)) && isCapTok(t) && toks[i + 1] && /^\d+[A-Za-z]?$/.test(toks[i + 1].text) && adjacent(t, toks[i + 1])) {
      segs.push({ start: t.start, end: toks[i + 1].end, kind: "numbered", firstTok: i, lastTok: i + 1 });
      i += 1;
      continue;
    }
    // "Ashoka Enclave", "Riverside Farmhouse"
    if (isCapTok(t) && PLACE_SUFFIX.has(lower(t)) && i > 0) {
      let k = i;
      let count = 0;
      while (k - 1 >= 0 && count < 3) {
        const p = toks[k - 1];
        if (!adjacent(p, toks[k]) || !isCapTok(p) || STOP_WORDS.has(p.text) || VEHICLE_WORDS.has(p.text) || !isFree(p.start, p.end)) break;
        k--;
        count++;
      }
      if (count > 0) {
        segs.push({ start: toks[k].start, end: t.end, kind: "suffix", firstTok: k, lastTok: i });
      }
    }
  }
  segs.sort((a, b) => a.start - b.start);
  // "Sonipat district": keep the word "district" with the name
  for (const sg of segs) {
    const nx = toks[sg.lastTok + 1];
    if (nx && adjacent(toks[sg.lastTok], nx) && ["district", "city", "town", "tehsil", "taluka", "village"].includes(lower(nx)) && sg.kind !== "suffix") {
      sg.end = nx.end;
      sg.lastTok += 1;
    }
  }
  // merge comma-joined segments into one address: "Plot 14, Sector 21, Gurugram, Haryana"
  const chains: { start: number; end: number; kinds: Seg["kind"][] }[] = [];
  for (const sg of segs) {
    const prev = chains[chains.length - 1];
    if (prev && /^\s*,\s*$/.test(text.slice(prev.end, sg.start))) {
      const prevKind = prev.kinds[prev.kinds.length - 1];
      if (sg.kind === "state" || prevKind === "numbered" || prevKind === "suffix") {
        prev.end = sg.end;
        prev.kinds.push(sg.kind);
        continue;
      }
    }
    chains.push({ start: sg.start, end: sg.end, kinds: [sg.kind] });
  }
  for (const c of chains) {
    if (!isFree(c.start, c.end)) continue;
    const label = text.slice(c.start, c.end).replace(/\s+/g, " ");
    const strong = c.kinds.includes("city") || c.kinds.includes("state");
    add("location", label, c.start, c.end, strong ? 90 : c.kinds.length > 1 ? 78 : 72);
  }
  // places the gazetteer does not know: "a rented flat at Madhapur", "resident of Ramnagar"
  const placeCueRe =
    /\b(?:resident of|r\/o|native of|hailing from|(?:flat|house|office|shop|godown|warehouse|hotel|lodge|residence|hideout|apartment|farmhouse|room|premises|locality|area|village|town|city|district)\s+(?:at|in|of|near))\s+([A-Z][a-z]{2,}[A-Za-z'’-]*(?:\s+[A-Z][a-z]{2,}[A-Za-z'’-]*){0,2})/g;
  for (const pm of text.matchAll(placeCueRe)) {
    const name = pm[1];
    const s = (pm.index ?? 0) + pm[0].length - name.length;
    const e = s + name.length;
    if (!isFree(s, e) || name.split(" ").some((w) => STOP_WORDS.has(w) || VEHICLE_WORDS.has(w))) continue;
    add("location", name, s, e, 70);
  }

  // ---- 6. people: runs of capitalised name-like words, judged by the words around them
  const isNameTok = (t: Tok) =>
    /^[A-Z][a-z][A-Za-z'’-]*$/.test(t.text) &&
    !STOP_WORDS.has(t.text) &&
    !VEHICLE_WORDS.has(t.text) &&
    !GAZETTEER_WORDS.has(lower(t)) &&
    !PLACE_SUFFIX.has(lower(t)) &&
    !ORG_SUFFIX.has(lower(t)) &&
    isFree(t.start, t.end);
  const isInitial = (i: number) =>
    /^[A-Z]$/.test(toks[i]?.text ?? "") && toks[i + 1]?.text === "." && toks[i + 1].start === toks[i].end && isFree(toks[i].start, toks[i].end);
  const isAllCaps = (t: Tok) => /^[A-Z]{3,}$/.test(t.text) && !STOP_WORDS.has(t.text) && !AGENCIES.includes(t.text) && isFree(t.start, t.end) && !/^(IPC|BNS|FIR|NDPS|PMLA|UAPA|CDR|SIM|UPI|OTP|ATM|GST|PAN|IFSC|IMEI|CCTV|NCR|SUV)$/.test(t.text);
  const connectors = new Set(["bin", "ibn", "al", "ul", "ur", "de", "van", "von", "da", "ben"]);

  interface Run {
    from: number;
    to: number; // inclusive token index
    start: number;
    end: number;
    words: number;
    allCaps: boolean;
  }
  function readRun(i: number): Run | null {
    let j = i;
    let words = 0;
    let allCaps = false;
    let endTok = i;
    while (j < toks.length && words < 4) {
      const t = toks[j];
      if (words > 0 && !adjacent(toks[endTok], t)) break;
      if (isInitial(j)) {
        words++;
        endTok = j + 1;
        j += 2;
        continue;
      }
      if (isNameTok(t)) {
        words++;
        endTok = j;
        j++;
        continue;
      }
      if (isAllCaps(t)) {
        words++;
        allCaps = true;
        endTok = j;
        j++;
        continue;
      }
      if (words > 0 && connectors.has(lower(t)) && toks[j + 1] && adjacent(t, toks[j + 1]) && isNameTok(toks[j + 1])) {
        endTok = j;
        j++;
        continue;
      }
      break;
    }
    if (words === 0) return null;
    return { from: i, to: endTok, start: toks[i].start, end: toks[endTok].end, words, allCaps };
  }

  const tagsFor = (s: number): PersonTag[] => {
    const before = text.slice(Math.max(0, s - 40), s);
    const tags: PersonTag[] = [];
    if (ACCUSED_TAG_RE.test(before.slice(-32))) tags.push("accused");
    if (VICTIM_TAG_RE.test(before.slice(-32))) tags.push("victim");
    if (WITNESS_TAG_RE.test(before.slice(-32))) tags.push("witness");
    return tags;
  };

  // people found so far, by each word of their name: "Verma" -> [Rohan Verma]. Lets "Verma" or "Sheikh"
  // later in the text point back to the full name instead of becoming a new person.
  const ownersOf = new Map<string, NlpEntity[]>();
  const registerName = (e: NlpEntity) => {
    const words = e.label.split(/\s+/).filter((w) => /^[A-Z][a-z]{2,}/.test(w));
    if (words.length < 2) return;
    for (const w of words) {
      const k = w.toLowerCase();
      const list = ownersOf.get(k) ?? [];
      if (!list.includes(e)) list.push(e);
      ownersOf.set(k, list);
    }
  };
  const ownerFor = (word: string): NlpEntity | undefined => {
    const list = ownersOf.get(word.toLowerCase());
    if (!list?.length) return undefined;
    // several people share the word: prefer the accused, then whoever has been mentioned most
    return [...list].sort((a, b) => Number(b.tags.includes("accused")) - Number(a.tags.includes("accused")) || b.mentions.length - a.mentions.length)[0];
  };

  // people already known from the graph can be mentioned by surname alone later in the text
  for (const e of found.values()) if (e.type === "person" && e.entityId) registerName(e);

  for (let i = 0; i < toks.length; i++) {
    if (!(isNameTok(toks[i]) || isInitial(i) || isAllCaps(toks[i]))) continue;
    const run = readRun(i);
    if (!run) continue;
    const before = text.slice(Math.max(0, run.start - 48), run.start);
    const after = text.slice(run.end, run.end + 40);
    const strong = PERSON_CUE_BEFORE_RE.test(before) || PERSON_CUE_AFTER_RE.test(after);

    // a single word that is part of a name we already have ("Verma", "Sheikh"): another mention of that person
    if (run.words === 1 && !run.allCaps && !isInitial(i)) {
      const owner = ownerFor(text.slice(run.start, run.end));
      if (owner) {
        owner.mentions.push({ start: run.start, end: run.end });
        for (const t of tagsFor(run.start)) if (!owner.tags.includes(t)) owner.tags.push(t);
        take(run.start, run.end);
        i = run.to;
        continue;
      }
    }

    // "Sajid Mir, alias Wasi" where Sajid Mir was already found (for example in the graph): Wasi is the same person
    if (run.words === 1 && !run.allCaps) {
      const lead = text.slice(Math.max(0, run.start - 40), run.start);
      const cue = lead.match(/(?:,\s*)?\(?\s*(?:alias|aka|a\.k\.a\.?|urf|@|also known as|popularly known as|known as)\s*$/i);
      if (cue) {
        const cueStart = run.start - lead.length + (cue.index ?? 0);
        let owner: NlpEntity | undefined;
        for (const f of found.values()) {
          if (f.type !== "person" || f.role) continue;
          if (f.mentions.some((mn) => mn.end <= cueStart && cueStart - mn.end <= 1)) owner = f;
        }
        if (owner) {
          const alias = text.slice(run.start, run.end);
          if (!owner.aliases.includes(alias)) owner.aliases.push(alias);
          owner.mentions.push({ start: run.start, end: run.end });
          take(run.start, run.end);
          i = run.to;
          continue;
        }
      }
    }

    // "Rohan Verma alias Rocky": read the alias as part of the same person
    const aliasM = after.match(/^\s*,?\s*\(?\s*(?:alias|aka|a\.k\.a\.?|urf|@|also known as|popularly known as|known as)\s*/i);
    const aliases: string[] = [];
    let aliasSpan: Mention | null = null;
    if (aliasM) {
      const nextIdx = toks.findIndex((t) => t.start >= run.end + aliasM[0].length);
      if (nextIdx !== -1 && (isNameTok(toks[nextIdx]) || isAllCaps(toks[nextIdx]))) {
        const ar = readRun(nextIdx);
        if (ar && ar.words <= 3) {
          aliases.push(text.slice(ar.start, ar.end));
          aliasSpan = { start: ar.start, end: ar.end };
        }
      }
    }
    let accept = false;
    let conf = 0;
    if (run.allCaps) {
      accept = strong;
      conf = 82;
    } else if (run.words >= 2) {
      accept = true;
      conf = strong ? 90 : 68;
    } else if (strong) {
      accept = true;
      conf = 78;
    }
    if (!accept) {
      i = run.to;
      continue;
    }
    const label = text.slice(run.start, run.end).replace(/\s+/g, " ").replace(/\s\./g, ".");
    const display = run.allCaps ? label.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : label;
    const ent = add("person", display, run.start, run.end, conf, { tags: tagsFor(run.start), aliases });
    registerName(ent);
    if (aliasSpan) {
      ent.mentions.push(aliasSpan);
      take(aliasSpan.start, aliasSpan.end);
      i = Math.max(i, toks.findIndex((t) => t.start >= aliasSpan!.end) - 1);
    } else {
      i = Math.max(i, run.to);
    }
  }

  // ---- 7. mentions by surname or first name only that were not caught above (e.g. before the full name appears)
  for (const t of toks) {
    if (!/^[A-Z][a-z]{2,}/.test(t.text) || !isFree(t.start, t.end) || STOP_WORDS.has(t.text)) continue;
    const owner = ownerFor(t.text);
    if (owner && (ownersOf.get(lower(t))?.length ?? 0) === 1) {
      owner.mentions.push({ start: t.start, end: t.end });
      take(t.start, t.end);
    }
  }
  // ---- 8. match what was found against the graph (fuzzy names: "R. Verma" = "Rohan Verma")
  const stripTitles = (s: string) => norm(s.replace(new RegExp("\\b(?:" + PERSON_TITLES.join("|") + ")\\.?\\s+", "gi"), ""));
  const knownByType = new Map<EntityType, Entity[]>();
  for (const e of known) knownByType.set(e.type, [...(knownByType.get(e.type) ?? []), e]);
  const taken = new Set<string>();
  for (const e of found.values()) if (e.entityId) taken.add(e.entityId);

  for (const e of [...found.values()]) {
    if (e.entityId || e.role || !["person", "organization", "location"].includes(e.type)) continue;
    const candidates = knownByType.get(e.type) ?? [];
    if (!candidates.length) continue;
    const cand = stripTitles(e.label);
    const cTokens = cand.split(" ").filter(Boolean);
    let best: { ent: Entity; score: number } | null = null;
    // a lone surname or first name that only one known person carries
    if (e.type === "person" && cTokens.length === 1 && cTokens[0].length >= 4) {
      const holders = candidates.filter((k) => stripTitles(k.name).split(" ").includes(cTokens[0]));
      if (holders.length === 1) best = { ent: holders[0], score: 0.82 };
    }
    for (const k of candidates) {
      const names = [k.name, ...(k.type === "person" ? k.aliases : [])];
      for (const nm of names) {
        const kn = stripTitles(nm);
        const kTokens = kn.split(" ").filter(Boolean);
        let score = 0;
        if (kn === cand) score = 1;
        else if (e.aliases.some((a) => stripTitles(a) === kn)) score = 0.98;
        else if (cTokens.length && kTokens.length) {
          const shorter = cTokens.length <= kTokens.length ? cTokens : kTokens;
          const longer = cTokens.length <= kTokens.length ? kTokens : cTokens;
          const subset = shorter.every((w) => longer.includes(w));
          const lastSame = cTokens[cTokens.length - 1] === kTokens[kTokens.length - 1];
          const initialOk = cTokens.length >= 2 && kTokens.length >= 2 && cTokens[0].length === 1 && kTokens[0].startsWith(cTokens[0]);
          if (subset && shorter.length >= 2) score = 0.88;
          else if (lastSame && initialOk) score = 0.9;
          else score = jaroWinkler(cand, kn) >= 0.94 && cand.length >= 6 ? 0.84 : 0;
          if (e.type === "location" && score === 0) {
            const overlap = cTokens.filter((w) => kTokens.includes(w)).length / new Set([...cTokens, ...kTokens]).size;
            if (overlap >= 0.6) score = 0.8;
          }
        }
        if (score > (best?.score ?? 0)) best = { ent: k, score };
      }
    }
    if (best && best.score >= 0.8) {
      const existing = found.get(`k:${best.ent.id}`);
      if (existing && existing !== e) {
        existing.mentions.push(...e.mentions);
        for (const t of e.tags) if (!existing.tags.includes(t)) existing.tags.push(t);
        found.delete(e.key);
      } else if (!existing) {
        found.delete(e.key);
        e.key = `k:${best.ent.id}`;
        found.set(e.key, e);
        e.entityId = best.ent.id;
        e.matchScore = best.score;
        e.label = best.ent.name;
        e.confidence = Math.min(99, Math.max(e.confidence, 80) + 8);
      }
    }
  }
  for (const e of found.values()) {
    if (e.entityId) e.confidence = Math.min(99, e.confidence);
    e.mentions.sort((a, b) => a.start - b.start);
    // drop duplicate mention ranges
    e.mentions = e.mentions.filter((mn, idx, arr) => idx === 0 || mn.start !== arr[idx - 1].start);
  }

  // ---- 9. relationships, sentence by sentence
  const all = [...found.values()].filter((e) => !e.role);
  const sentenceOf = (pos: number) => {
    let lo = 0;
    let hi = sentences.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pos >= sentences[mid].end) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const perSentence = new Map<number, { e: NlpEntity; m: Mention }[]>();
  for (const e of all) {
    for (const mn of e.mentions) {
      const si = sentenceOf(mn.start);
      const list = perSentence.get(si) ?? [];
      list.push({ e, m: mn });
      perSentence.set(si, list);
    }
  }
  const existingPairs = new Set(existingRels.map((r) => [r.sourceId, r.targetId].sort().join("|")));
  const rels = new Map<string, NlpRelationship>();
  let lastSubject: NlpEntity | null = null;
  let lastAccused: NlpEntity | null = null;

  type Ment = { e: NlpEntity; m: Mention };
  // "son of Abdul Sheikh": Abdul is the object of a family phrase, so he is not the subject of what follows
  const FAMILY_OBJECT_RE = /(?:son of|daughter of|wife of|husband of|brother of|sister of|father of|mother of|s\/o|d\/o|w\/o|c\/o)\s*(?:shri|smt|mr|mrs|ms|dr|sh)?\.?\s*$/i;
  const familyObject = (x: Ment) => FAMILY_OBJECT_RE.test(text.slice(Math.max(0, x.m.start - 24), x.m.start));
  // "Headley, who scouted the targets together with Rana, pleaded guilty in the US": Rana is a side remark, Headley is the subject
  const sideRemark = (x: Ment) => /\bwith\s*$/i.test(text.slice(Math.max(0, x.m.start - 12), x.m.start)) && /^\s*,/.test(text.slice(x.m.end, x.m.end + 3));
  const RESIDENCE_RE = /\b(resident of|r\/o|resides?|lives?|living|native of|hailing from)\b/;
  const PLACE_STRONG_RE = /\b(resident of|r\/o|resides?|lives?|lived|living|native of|hailing from|present|parked|located|based|stayed|staying|hideout|found|recovered|arrested (?:from|at)|raided|hiding|sheltered|visited|frequent\w*|operat\w+ (?:from|out of)|office|flat|house|warehouse|godown|farmhouse|shop)\b/;
  const PLACE_WEAK_RE = /\b(at|in|near|from|to|via)\b/;
  const FIN_STRONG_RE = /\b(transfer\w*|remit\w*|paid|payments?|deposit\w*|received|wired|siphon\w*|routed|layered)\b/;

  const register = (
    source: Ment,
    target: Ment,
    rule: Rule,
    cue: string,
    confidence: number,
    sen: string,
    phrase: string = rule.phrase,
  ) => {
    const conf = clamp(Math.round(confidence), 35, 96);
    if (conf < 50 || source.e.key === target.e.key) return;
    const type = rule.type;
    const dedupe = `${[source.e.key, target.e.key].sort().join("|")}|${type}`;
    const prev = rels.get(dedupe);
    if (prev) {
      prev.frequency += 1;
      prev.confidence = Math.max(prev.confidence, conf);
      return;
    }
    const evidence = sen.replace(/\s+/g, " ").trim();
    const both = source.e.entityId && target.e.entityId;
    rels.set(dedupe, {
      id: `nlp-rel-${rels.size + 1}`,
      type,
      sourceKey: source.e.key,
      targetKey: target.e.key,
      sourceLabel: source.e.label,
      targetLabel: target.e.label,
      label: `${source.e.label} ${phrase} ${target.e.label}`,
      cue: cue.trim(),
      confidence: conf,
      strength: clamp(STRENGTH[type] + (conf >= 85 ? 1 : conf < 60 ? -1 : 0), 2, 9),
      evidence: evidence.length > 260 ? evidence.slice(0, 257) + "…" : evidence,
      frequency: 1,
      existing: !!both && existingPairs.has([source.e.entityId!, target.e.entityId!].sort().join("|")),
    });
  };

  const tryPair = (A: Ment, B: Ment, sen: string, senLower: string, nEnts: number, segFrom: number) => {
    const [first, second] = A.m.start <= B.m.start ? [A, B] : [B, A];
    // only the words directly in front of the second entity count as the cue (not words that belong to other entities in between)
    const between = text.slice(Math.max(first.m.end, segFrom), second.m.start).toLowerCase();
    const dist = between.length;
    if (text.slice(first.m.end, second.m.start).length > 260) return;
    const tA = A.e.type;
    const tB = B.e.type;
    const involvesPlace = tA === "location" || tB === "location";
    const bareOnly = involvesPlace || [tA, tB].some((t) => t === "phone" || t === "vehicle" || t === "financial_account");
    let picked: { rule: Rule; cue: string; inBetween: boolean; penalty: number } | null = null;

    if (involvesPlace) {
      if (tA === "location" && tB === "location") return;
      const who = tA === "location" ? B : A;
      const placeFirst = first.e.type === "location";
      const strong = between.match(PLACE_STRONG_RE);
      if (strong) {
        if (RESIDENCE_RE.test(strong[0]) && familyObject(who)) return;
        picked = { rule: RULES.place, cue: strong[0], inBetween: true, penalty: 0 };
      } else if (dist <= 60 && who.e.type !== "vehicle" && !placeFirst && !sideRemark(who)) {
        const weak = between.match(PLACE_WEAK_RE);
        if (weak) picked = { rule: RULES.place, cue: weak[0], inBetween: true, penalty: 8 };
        else if (between.trim() === "of") picked = { rule: RULES.place, cue: "of", inBetween: true, penalty: 8 };
      }
    } else {
      const order = orderFor(tA, tB);
      // a cue between the two mentions beats a cue elsewhere in the sentence
      for (const name of order) {
        const mb = between.match(RULES[name].re);
        if (mb) {
          picked = { rule: RULES[name], cue: mb[0], inBetween: true, penalty: 0 };
          break;
        }
      }
      if (!picked && !bareOnly && nEnts <= 4) {
        for (const name of order) {
          const ms = senLower.match(RULES[name].re);
          if (ms) {
            picked = { rule: RULES[name], cue: ms[0], inBetween: false, penalty: 12 };
            break;
          }
        }
      }
      if (!picked) {
        const pair = [tA, tB].sort().join("+");
        if (pair === "person+vehicle" && dist < 160) picked = { rule: RULES.vehicle, cue: "mentioned with", inBetween: true, penalty: 6 };
        else if (pair === "person+phone" && dist < 100) picked = { rule: RULES.association, cue: "number of", inBetween: true, penalty: 4 };
        else if (pair === "financial_account+person" && dist < 100) picked = { rule: RULES.business, cue: "held by", inBetween: true, penalty: 4 };
      }
    }
    if (!picked) return;
    if (familyObject(first) && picked.rule.type !== "family") return;
    // "received from": the money moves the other way
    const swap = picked.rule.type === "financial_transaction" && /receiv|got|credited/.test(picked.cue) && /\bfrom\b/.test(between);
    const source = swap ? second : first;
    const target = swap ? first : second;
    const avg = (source.e.confidence + target.e.confidence) / 2;
    let conf = picked.rule.base * 0.62 + avg * 0.38 - picked.penalty;
    if (dist > 150) conf -= 8;
    const phrase =
      picked.rule.type === "business" && (tA === "financial_account" || tB === "financial_account")
        ? "is the account holder of"
        : picked.rule.phrase;
    register(source, target, picked.rule, picked.cue, conf, sen, phrase);
  };

  const sentenceIdxs = [...perSentence.keys()].sort((a, b) => a - b);
  for (const si of sentenceIdxs) {
    const list = (perSentence.get(si) ?? []).sort((a, b) => a.m.start - b.m.start);
    const sen = text.slice(sentences[si].start, sentences[si].end);
    const senLower = sen.toLowerCase();
    // one entry per entity in this sentence (its first mention), in reading order
    const seen = new Set<string>();
    const ents: Ment[] = [];
    for (const x of list) {
      if (seen.has(x.e.key)) continue;
      seen.add(x.e.key);
      ents.push(x);
    }
    const transparent = (x: Ment) => x.e.type === "location" || familyObject(x) || sideRemark(x);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[i].e.key === list[j].e.key) continue;
        let blocked = false;
        for (let k = i + 1; k < j; k++) if (!transparent(list[k]) && list[k].e.key !== list[i].e.key) blocked = true;
        if (blocked) continue;
        tryPair(list[i], list[j], sen, senLower, ents.length, list[j - 1].m.end);
      }
    }

    // people named together as accused ("A, B and C were arrested") are co-accused
    const persons = ents.filter((x) => x.e.type === "person");
    if (persons.length >= 2 && ACCUSED_TAG_RE.test(sen)) {
      for (let i = 0; i < persons.length; i++) {
        for (let j = i + 1; j < persons.length; j++) {
          const key = [persons[i].e.key, persons[j].e.key].sort().join("|");
          const has = [...rels.keys()].some((k) => k.startsWith(key + "|"));
          if (!has && !familyObject(persons[j]) && !familyObject(persons[i])) register(persons[i], persons[j], RULES.association, "co-accused", 60, sen, "is a co-accused with");
        }
      }
    }

    // "The accused used mobile number ...": the accused is the last accused person named
    if (
      lastAccused &&
      /^\s*(?:the\s+)?(?:main\s+)?(?:accused|suspect|arrested\s+(?:person|man|woman)|kingpin|mastermind)\b/i.test(sen) &&
      !persons.some((p) => p.e.tags.includes("accused"))
    ) {
      const subj: Ment = { e: lastAccused, m: lastAccused.mentions[0] };
      for (const x of ents) {
        if (x.e.type === "phone") register(subj, x, RULES.association, "used by the accused", 64, sen, "used the number");
        else if (x.e.type === "vehicle") register(subj, x, RULES.vehicle, "used by the accused", 64, sen);
        else if (x.e.type === "financial_account") register(subj, x, RULES.business, "used by the accused", 62, sen, "operated the account");
      }
    }

    // money moved in this sentence, but the payer was named earlier
    // ("... account held by A. It shows a transfer to an account held by B")
    if (lastSubject && FIN_STRONG_RE.test(senLower)) {
      const already = [...rels.values()].some((r) => r.type === "financial_transaction" && ents.some((x) => x.e.key === r.sourceKey || x.e.key === r.targetKey));
      const inSentence = ents.some((x) => x.e.key === lastSubject!.key);
      if (!already && !inSentence) {
        const target = ents.find((x) => x.e.type === "person" || x.e.type === "organization") ?? ents.find((x) => x.e.type === "financial_account");
        if (target) {
          const conf = RULES.financial.base * 0.62 + (lastSubject.confidence + target.e.confidence) * 0.19 - 15;
          register({ e: lastSubject, m: lastSubject.mentions[0] }, target, RULES.financial, senLower.match(FIN_STRONG_RE)![0], conf, sen);
        }
      }
    }

    const subject = ents.find((x) => x.e.type === "person" || x.e.type === "organization");
    if (subject) lastSubject = subject.e;
    const acc = ents.find((x) => x.e.type === "person" && x.e.tags.includes("accused"));
    if (acc) lastAccused = acc.e;
  }

  // ---- 10. facts: amounts, dates, legal sections, IFSC codes, and what kind of crime this is
  const facts: NlpFact[] = [];
  const pushFact = (kind: NlpFact["kind"], t: string) => {
    const clean = t.replace(/\s+/g, " ").trim();
    if (clean && !facts.some((f) => f.kind === kind && f.text.toLowerCase() === clean.toLowerCase())) facts.push({ kind, text: clean });
  };
  for (const a of text.matchAll(/(?:₹|Rs\.?|INR)\s?\d[\d,]*(?:\.\d+)?(?:\s?[–-]\s?\d[\d,]*(?:\.\d+)?)?(?:\s?(?:lakh|lakhs|lac|crore|crores|cr|thousand|million|billion))?/gi)) pushFact("amount", a[0]);
  for (const a of text.matchAll(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{1,2}(?:st|nd|rd|th)?\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?,?\s\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s\d{1,2},?\s\d{4}\b|\b(?:January|February|March|April|June|July|August|September|October|November|December)\s\d{4}\b/g)) pushFact("date", a[0]);
  for (const a of text.matchAll(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g)) pushFact("ifsc", a[0]);
  for (const h of handles) pushFact("handle", `@${h.handle}${h.platform === "Unspecified" ? "" : ` (${h.platform})`}`);

  const crimeMap = new Map<string, string>();
  const ACTS = "IPC|BNS|CrPC|BNSS|NDPS(?:\\s+Act)?|PMLA|UAPA|MCOCA|POCSO|IT\\s+Act|Arms\\s+Act|PC\\s+Act|FEMA|Customs\\s+Act|Explosive\\s+Substances\\s+Act|Immoral\\s+Traffic";
  const NUM = "\\d{1,3}[A-Z]?(?:\\(\\d+\\))?";
  const numList = `${NUM}(?:\\s*(?:,|and|&|/|r/w)\\s*${NUM})*`;
  const noteSections = (list: string, act: string | undefined) => {
    const actName = act ? act.replace(/\s+/g, " ") : "";
    const actKey = actName.toUpperCase().replace(/ ACT$/, "");
    for (const raw of list.split(/\s*(?:,|and|&|\/|r\/w)\s*/i)) {
      const n = raw.trim().toUpperCase();
      if (!n) continue;
      pushFact("section", `Section ${n}${actName ? " " + actName : ""}`);
      const cat = SECTION_CATEGORY[n];
      if (cat && (!actKey || actKey === "IPC" || actKey === "BNS" || actKey === "IT")) crimeMap.set(cat, `Section ${n}${actName ? " " + actName : ""}`);
    }
  };
  for (const s of text.matchAll(new RegExp(`\\b(?:Sections?|Secs?\\.?|u/s)\\s+(${numList})(?:\\s*(?:of\\s+(?:the\\s+)?)?(${ACTS}))?`, "gi"))) noteSections(s[1], s[2]);
  for (const s of text.matchAll(new RegExp(`\\b(${ACTS})\\s*(?:,|-)?\\s*(?:Sections?|Secs?\\.?)\\s+(${numList})`, "gi"))) noteSections(s[2], s[1]);
  for (const a of text.matchAll(new RegExp(`\\b(${ACTS})\\b`, "gi"))) {
    const actKey = a[1].toUpperCase().replace(/\s+/g, " ");
    const cat = ACT_CATEGORY[actKey] ?? ACT_CATEGORY[actKey.replace(/ ACT$/, "")];
    if (cat) crimeMap.set(cat, a[1].replace(/\s+/g, " "));
  }
  for (const rule of CRIME_KEYWORDS) {
    const hit = text.match(rule.pattern);
    if (hit && !crimeMap.has(rule.category)) crimeMap.set(rule.category, hit[0].toLowerCase());
  }
  const crimes = [...crimeMap.entries()].slice(0, 6).map(([category, evidence]) => ({ category, evidence }));

  // ---- result
  const list = [...found.values()].sort((a, b) => (a.mentions[0]?.start ?? 0) - (b.mentions[0]?.start ?? 0));
  const entities = list.filter((e) => !e.role);
  const excluded = list.filter((e) => e.role);
  const relationships = [...rels.values()].sort((a, b) => b.confidence - a.confidence);
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    entities,
    excluded,
    relationships,
    crimes,
    facts,
    handles,
    stats: { chars: text.length, sentences: sentences.length, ms: Math.max(1, Math.round(t1 - t0)) },
  };
}

// ---------------------------------------------------------------------------------------------
// helper for showing the text with entities marked up

export interface Segment {
  text: string;
  entity?: NlpEntity;
}

export function segmentText(text: string, result: NlpResult): Segment[] {
  const marks: { start: number; end: number; entity: NlpEntity }[] = [];
  for (const e of [...result.entities, ...result.excluded]) for (const m of e.mentions) marks.push({ ...m, entity: e });
  marks.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Segment[] = [];
  let pos = 0;
  for (const mk of marks) {
    if (mk.start < pos) continue;
    if (mk.start > pos) out.push({ text: text.slice(pos, mk.start) });
    out.push({ text: text.slice(mk.start, mk.end), entity: mk.entity });
    pos = mk.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
