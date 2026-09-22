// Finds social media handles and profile links written in case text: "@thevijaymallya", "https://x.com/pnbindia",
// "Instagram id: rohan_verma91". It only reads the text it is given; it never looks anyone up.

export interface HandleHit {
  platform: string;
  /** Without the leading @, as written. */
  handle: string;
  start: number;
  end: number;
  /** Set when the text was a profile link. */
  url?: string;
}

const PLATFORM_WORDS: [RegExp, string][] = [
  [/\b(?:twitter|tweet\w*|x\.com|on x)\b/i, "X"],
  [/\b(?:instagram|insta|ig)\b/i, "Instagram"],
  [/\b(?:facebook|fb)\b/i, "Facebook"],
  [/\b(?:youtube|yt)\b/i, "YouTube"],
  [/\b(?:linkedin)\b/i, "LinkedIn"],
  [/\b(?:telegram|tg)\b/i, "Telegram"],
  [/\b(?:whatsapp)\b/i, "WhatsApp"],
  [/\b(?:snapchat|snap)\b/i, "Snapchat"],
];

const LINK_RE =
  /(?<![\w@.-])(?:https?:\/\/)?(?:www\.|m\.|mobile\.)?(twitter\.com|x\.com|instagram\.com|facebook\.com|fb\.com|youtube\.com|linkedin\.com|t\.me|telegram\.me)\/(?:(?:in|company|channel|c|user)\/|@)?([A-Za-z0-9_.-]{2,60})/gi;

const HOST_PLATFORM: Record<string, string> = {
  "twitter.com": "X",
  "x.com": "X",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "fb.com": "Facebook",
  "youtube.com": "YouTube",
  "linkedin.com": "LinkedIn",
  "t.me": "Telegram",
  "telegram.me": "Telegram",
};

// "Instagram id: xyz", "Telegram handle - @xyz", "Twitter: xyz"
const LABELLED_RE =
  /\b(twitter|x|instagram|insta|facebook|fb|youtube|telegram|snapchat|linkedin)\s*((?:id|handle|username|user\s?name|account|profile|page)\b)?\s*(?:[:=-]|is\b)\s*@?([A-Za-z0-9_.]{3,30})\b/gi;

const AT_RE = /(?<![\w.@/])@([A-Za-z0-9_]{3,30})\b/g;

const NOT_HANDLES = new Set(["the", "and", "for", "with", "not", "was", "has", "are", "his", "her", "its", "this", "that", "from", "account", "handle", "profile"]);

/** The platform named right after a handle ("@abc on Twitter", "@abc (Instagram)") or in the ~70 characters before it. */
function platformNear(text: string, start: number, end: number): string {
  const after = text.slice(end, end + 40).match(/^\s*[,(]?\s*(?:on|via|from|at|\()?\s*(twitter|x|instagram|insta|facebook|fb|youtube|telegram|snapchat|linkedin)\b/i);
  if (after) {
    const k = after[1].toLowerCase();
    return k === "x" || k === "twitter" ? "X" : k === "insta" ? "Instagram" : k === "fb" ? "Facebook" : k[0].toUpperCase() + k.slice(1);
  }
  const before = text.slice(Math.max(0, start - 70), start);
  let best: { platform: string; at: number } | null = null;
  for (const [re, platform] of PLATFORM_WORDS) {
    const g = new RegExp(re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = g.exec(before))) if (!best || m.index > best.at) best = { platform, at: m.index };
  }
  return best?.platform ?? "Unspecified";
}

export function extractHandles(text: string): HandleHit[] {
  const hits: HandleHit[] = [];
  const overlaps = (s: number, e: number) => hits.some((h) => s < h.end && e > h.start);

  for (const m of text.matchAll(LINK_RE)) {
    const s = m.index ?? 0;
    const host = m[1].toLowerCase();
    const handle = m[2].replace(/[.-]+$/, "");
    if (["share", "intent", "home", "hashtag", "watch", "search", "login"].includes(handle.toLowerCase())) continue;
    hits.push({ platform: HOST_PLATFORM[host] ?? host, handle, start: s, end: s + m[0].length, url: m[0] });
  }

  for (const m of text.matchAll(LABELLED_RE)) {
    const s = m.index ?? 0;
    const e = s + m[0].length;
    const handle = m[3];
    // "Twitter is down": with no "@" and no word like "id" or "handle", the word must look like a handle (a digit, "_" or ".")
    if (!m[0].includes("@") && !m[2] && !/[\d_.]/.test(handle)) continue;
    if (NOT_HANDLES.has(handle.toLowerCase()) || overlaps(s, e)) continue;
    const key = m[1].toLowerCase();
    const platform = key === "x" || key === "twitter" ? "X" : key === "insta" ? "Instagram" : key === "fb" ? "Facebook" : key[0].toUpperCase() + key.slice(1);
    hits.push({ platform, handle, start: s, end: e });
  }

  for (const m of text.matchAll(AT_RE)) {
    const s = m.index ?? 0;
    const e = s + m[0].length;
    if (overlaps(s, e) || NOT_HANDLES.has(m[1].toLowerCase())) continue;
    hits.push({ platform: platformNear(text, s, e), handle: m[1], start: s, end: e });
  }

  return hits.sort((a, b) => a.start - b.start);
}

export interface KnownProfile {
  entityId: string;
  platform: string;
  handle: string;
  url: string;
}

const samePlatform = (a: string, b: string) => a === b || a === "Unspecified" || b === "Unspecified";

/** A handle that matches an account already documented for someone in the case, or undefined. */
export function matchKnown(hit: HandleHit, known: KnownProfile[]): KnownProfile | undefined {
  const h = hit.handle.toLowerCase();
  return known.find((k) => k.handle.toLowerCase() === h && samePlatform(k.platform, hit.platform));
}
