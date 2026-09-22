// Builds server/dataset/social.ts: the official social media accounts of the PUBLIC FIGURES and ORGANISATIONS in the cases.
//
//   npx tsx server/dataset/fetch-social.ts
//
// Where the data comes from: Wikidata, the public database behind Wikipedia. Each name below is tied to one Wikipedia
// article by hand, and Wikidata lists the official accounts that are documented for that article. Nothing is scraped from
// the platforms and no one is searched for by name: private individuals, victims and people convicted of terrorism are not
// looked up at all (they are shown as "not searched" in the app). Run it again to refresh the stored copy; the app never calls
// Wikidata itself, so it works offline and shows the same thing every time.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SocialPresence, SocialProfile } from "../../src/types/index.ts";

/** entity id -> title of its English Wikipedia article. Only public figures and organisations belong here. */
const CHECKED: Record<string, string> = {
  // people who hold or held public office, or lead large public companies
  mallya: "Vijay Mallya",
  raja: "A. Raja",
  kanimozhi: "Kanimozhi Rajathi Karunanidhi",
  kghosh: "Kunal Ghosh",
  usha: "Usha Ananthasubramanian",
  raju: "Ramalinga Raju",
  nirav: "Nirav Modi",
  choksi: "Mehul Choksi",
  kmahindra: "Keshub Mahindra",
  // organisations
  sbi: "State Bank of India",
  pnb: "Punjab National Bank",
  techm: "Tech Mahindra",
  ubg: "United Breweries Group",
  kfa: "Kingfisher Airlines",
  bse: "Bombay Stock Exchange",
  etisalat: "Etisalat",
  telenor: "Telenor",
  finmeccanica: "Leonardo S.p.A.",
  agustawestland: "AgustaWestland",
  ucc: "Union Carbide",
  ftil: "63 Moons Technologies",
  kalaignar: "Kalaignar TV",
  acc: "ACC (company)",
  taj: "Taj Mahal Palace Hotel",
};

const PLATFORMS: Record<string, { platform: string; url: (v: string) => string }> = {
  P2002: { platform: "X", url: (v) => `https://x.com/${v}` },
  P2003: { platform: "Instagram", url: (v) => `https://www.instagram.com/${v}/` },
  P2013: { platform: "Facebook", url: (v) => `https://www.facebook.com/${v}` },
  P2397: { platform: "YouTube", url: (v) => `https://www.youtube.com/channel/${v}` },
  P6634: { platform: "LinkedIn", url: (v) => `https://www.linkedin.com/in/${v}` },
  P4264: { platform: "LinkedIn", url: (v) => `https://www.linkedin.com/company/${v}` },
};

interface Snak {
  datavalue?: { value: unknown };
}
interface Statement {
  rank?: string;
  mainsnak: Snak;
  qualifiers?: Record<string, Snak[]>;
}
interface WdEntity {
  id: string;
  labels?: { en?: { value: string } };
  descriptions?: { en?: { value: string } };
  sitelinks?: { enwiki?: { title: string } };
  claims?: Record<string, Statement[]>;
}

const UA = "NexusTrace-SIH-prototype/1.0 (student hackathon project; https://github.com/lnfernoAnnoys/nexustrace)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wikidata(titles: string[]): Promise<WdEntity[]> {
  const url =
    "https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&format=json&languages=en" +
    "&props=claims%7Clabels%7Cdescriptions%7Csitelinks&titles=" +
    encodeURIComponent(titles.join("|"));
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.ok) {
      const body = (await res.json()) as { entities?: Record<string, WdEntity & { missing?: string }> };
      return Object.values(body.entities ?? {}).filter((e) => !("missing" in e));
    }
    await sleep(1500 * (attempt + 1));
  }
  throw new Error("Wikidata did not answer");
}

const strings = (claims: WdEntity["claims"], prop: string): string[] =>
  (claims?.[prop] ?? [])
    .filter((s) => s.rank !== "deprecated")
    .map((s) => s.mainsnak.datavalue?.value)
    .filter((v): v is string => typeof v === "string");

async function main() {
  const ids = Object.keys(CHECKED);
  const byTitle = new Map(ids.map((id) => [CHECKED[id].toLowerCase().replace(/_/g, " "), id]));
  const results: SocialPresence[] = [];
  const unresolved = new Set(ids);

  for (let i = 0; i < ids.length; i += 25) {
    const chunk = ids.slice(i, i + 25);
    const found = await wikidata(chunk.map((id) => CHECKED[id]));
    for (const e of found) {
      const title = e.sitelinks?.enwiki?.title ?? "";
      const id = byTitle.get(title.toLowerCase());
      if (!id) continue;
      unresolved.delete(id);

      const claims = e.claims ?? {};
      const profiles: SocialProfile[] = [];
      const seen = new Set<string>();
      for (const [prop, spec] of Object.entries(PLATFORMS)) {
        for (const handle of strings(claims, prop)) {
          const key = `${spec.platform}:${handle.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          profiles.push({ platform: spec.platform, handle, url: spec.url(handle) });
        }
      }

      const website = strings(claims, "P856")[0];
      results.push({
        entityId: id,
        wikidataId: e.id,
        label: e.labels?.en?.value ?? title,
        description: e.descriptions?.en?.value ?? "",
        wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        website,
        deceased: (claims.P570?.length ?? 0) > 0,
        profiles,
      });
    }
    await sleep(800);
  }

  results.sort((a, b) => ids.indexOf(a.entityId) - ids.indexOf(b.entityId));
  if (unresolved.size) console.warn("No Wikipedia article found for:", [...unresolved].map((id) => `${id} (${CHECKED[id]})`).join(", "));
  for (const r of results) {
    console.log(`${r.entityId.padEnd(14)} ${r.wikidataId.padEnd(10)} ${r.label.padEnd(36)} ${r.deceased ? "[deceased] " : ""}${r.profiles.map((p) => `${p.platform}:${p.handle}`).join(", ") || "-"}`);
  }

  const out = fileURLToPath(new URL("./social.ts", import.meta.url));
  const header =
    "// Generated by fetch-social.ts from Wikidata (CC0). Do not edit by hand; run `npx tsx server/dataset/fetch-social.ts`.\n" +
    `// Fetched ${new Date().toISOString().slice(0, 10)}.\n` +
    'import type { SocialPresence } from "../../src/types/index.ts";\n\n';
  writeFileSync(out, `${header}export const fetchedOn = "${new Date().toISOString().slice(0, 10)}";\n\nexport const social: SocialPresence[] = ${JSON.stringify(results, null, 2)};\n`, "utf8");
  console.log(`\nwrote ${results.length} entries to ${out}`);
}

// only run when started directly (the server imports the types from this file)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) void main();
