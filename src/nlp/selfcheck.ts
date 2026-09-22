// Quick check of the NLP engine on sample reports:  npx tsx src/nlp/selfcheck.ts
import { analyzeText } from "./extract";

const SAMPLES: { name: string; text: string; expect: string[] }[] = [
  {
    name: "FIR (surveillance)",
    text: "On 02.04.2026, acting on credible information, a team led by Inspector A. Sharma conducted surveillance near Plot 14, Sector 21, Gurugram, Haryana. The informant identified the warehouse as a suspected storage point being used by one Rohan Verma, resident of Ashoka Enclave, Faridabad, for movement of contraband via vehicle DL-01-AB-4471. Verma was seen coordinating with an individual believed to be Sunil Kadam of Sector 14, Gurugram. Further surveillance is recommended before action.",
    expect: ["person:Rohan Verma", "person:Sunil Kadam", "vehicle:DL-01-AB-4471", "location:Ashoka Enclave", "rel:association", "rel:vehicle_ownership", "crime:Narcotics"],
  },
  {
    name: "Surveillance report",
    text: "Field team observed a meeting between Rohan Verma and an unidentified male, later confirmed via cross-reference as Ehsaan Qureshi, at a farmhouse property in rural Sonipat district on the evening of 10.05.2026. The meeting lasted approximately 70 minutes. A grey Mahindra Scorpio bearing registration RJ-14-QF-3390 was parked at the location throughout.",
    expect: ["person:Rohan Verma", "person:Ehsaan Qureshi", "vehicle:RJ-14-QF-3390", "location:Sonipat"],
  },
  {
    name: "Suspicious transaction report",
    text: "Suspicious Transaction Report filed by HDFC Bank regarding account XXXXXXXX1187 held by Aditya Malhotra. Analysis identifies a recurring transfer pattern of ₹18–25 lakh to account XXXXXXXX2214 held by Oberoi Bullion & Forex, with no corresponding invoiced trade activity on record.",
    expect: ["person:Aditya Malhotra", "organization:Oberoi Bullion & Forex", "financial_account:1187", "financial_account:2214", "rel:financial_transaction", "crime:Money laundering / hawala"],
  },
  {
    name: "Social media intelligence",
    text: "Aggregated victim complaints from app-store reviews and social media reports reference a loan application distributed under the QuickCash Fintech Solutions brand. Multiple reports describe harassment calls originating from numbers later traced to the Sector 63, Noida location, with callers identifying themselves using aliases matching known associates of Naveen Reddy.",
    expect: ["organization:QuickCash Fintech Solutions", "location:Noida", "person:Naveen Reddy", "crime:Cyber crime / online fraud"],
  },
  {
    name: "Indian-style FIR paragraph",
    text: "Sub-Inspector Ramesh Yadav of Andheri Police Station arrested accused Imran Sheikh alias Bunty, son of Abdul Sheikh, resident of Mira Road, Thane, along with his associate Vikas Pandey on 14/03/2025 at Kurla Junction, Mumbai. During interrogation Sheikh disclosed that he had supplied 1.2 kg of mephedrone to Pandey, who sells it through Sunrise Traders Pvt. Ltd. The accused used mobile number 98765 43210 to contact Pandey. Case registered under Section 21 and 22 of the NDPS Act. Crime Branch and NCB have been informed. A sum of Rs 4.5 lakh was transferred from the account of Pandey to Sheikh through UPI.",
    expect: ["person:Imran Sheikh", "person:Vikas Pandey", "person:Abdul Sheikh", "phone:98765", "organization:Sunrise Traders Pvt. Ltd.", "rel:family", "rel:call", "crime:Narcotics"],
  },
  {
    name: "Cyber fraud news style",
    text: "Cyber cell of the Hyderabad police busted a gang of six that duped 214 people of Rs 3.2 crore through a fake investment app. Kingpin Rajesh Khanna, 34, a native of Jaipur, ran the call centre from a rented flat at Madhapur with help of his brother Suresh Khanna. The money was routed through mule accounts in Axis Bank and Kotak Mahindra Bank and later converted into crypto. Police recovered 42 SIM cards and a Swift car bearing registration TS-09-EA-1234.",
    expect: ["person:Rajesh Khanna", "person:Suresh Khanna", "location:Madhapur", "location:Jaipur", "vehicle:TS-09-EA-1234", "rel:family", "crime:Cyber crime / online fraud"],
  },
  {
    name: "Social media handles",
    text: "The complaint attaches a post by @thevijaymallya on Twitter dated 2 March 2016. The notice was also shared at https://x.com/pnbindia and on Instagram id: pnbindia, while a Telegram handle @quick_returns_2013 promoted the scheme. Reach the desk at desk.officer@gmail.com.",
    expect: ["handle:X:thevijaymallya", "handle:X:pnbindia", "handle:Instagram:pnbindia", "handle:Telegram:quick_returns_2013", "nohandle:gmail"],
  },
];

let failed = 0;
for (const s of SAMPLES) {
  const r = analyzeText(s.text);
  console.log(`\n=== ${s.name}  (${r.stats.chars} chars, ${r.stats.ms} ms)`);
  console.log(" entities :", r.entities.map((e) => `${e.type}:${e.label}${e.tags.length ? "[" + e.tags.join(",") + "]" : ""}${e.aliases.length ? "(aka " + e.aliases.join("/") + ")" : ""}~${e.confidence}`).join("  |  "));
  console.log(" excluded :", r.excluded.map((e) => `${e.role}:${e.label}`).join("  |  ") || "-");
  for (const rel of r.relationships) console.log(`   rel ${rel.type.padEnd(21)} ${rel.confidence}%  ${rel.label}   [cue: ${rel.cue}]`);
  console.log(" crimes   :", r.crimes.map((c) => `${c.category} (${c.evidence})`).join("; ") || "-");
  console.log(" facts    :", r.facts.map((f) => `${f.kind}:${f.text}`).join("; ") || "-");
  if (r.handles.length) console.log(" handles  :", r.handles.map((h) => `${h.platform}:${h.handle}`).join("; "));
  for (const ex of s.expect) {
    const [kind, ...rest] = ex.split(":");
    const val = rest.join(":");
    let ok = false;
    if (kind === "rel") ok = r.relationships.some((x) => x.type === val);
    else if (kind === "crime") ok = r.crimes.some((x) => x.category === val);
    else if (kind === "handle") ok = r.handles.some((h) => `${h.platform}:${h.handle}` === val);
    else if (kind === "nohandle") ok = !r.handles.some((h) => h.handle.includes(val)); // an e-mail address is not a handle
    else ok = r.entities.some((e) => e.type === kind && (e.label.includes(val) || e.aliases.some((a) => a.includes(val))));
    if (!ok) {
      failed++;
      console.log("   MISSING:", ex);
    }
  }
}
console.log(failed === 0 ? "\nALL EXPECTED ITEMS FOUND" : `\n${failed} expected item(s) missing`);
