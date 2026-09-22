import type { Entity, Relationship, RiskFactor } from "@/types";
import type { NlpEntity, NlpRelationship } from "./extract";

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z .]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";

function levelFor(score: number) {
  return score >= 85 ? "critical" : score >= 65 ? "high" : score >= 40 ? "medium" : "low";
}

/** Where an entity came from: found in text by the NLP engine, or named in a column of an imported file. */
export type EntityOrigin = "nlp" | "list";

/** The reasons a freshly extracted entity gets the score it does (it has not been assessed by a person yet). */
function factorsFor(e: NlpEntity, source: string, origin: EntityOrigin): RiskFactor[] {
  const f: RiskFactor[] =
    origin === "list"
      ? [{ label: "Listed in an imported file", points: 10, detail: `Named in ${source}; its role has not been assessed yet` }]
      : [{ label: "Added from a document by NLP", points: 10, detail: `Found in ${source}; its role has not been assessed yet` }];
  if (e.tags.includes("accused")) f.push({ label: "Described as accused in the text", points: 30, detail: "The document uses words such as accused, arrested or absconding near this name" });
  if (e.tags.includes("victim")) f.push({ label: "Described as a victim in the text", points: -5, detail: "The document describes this person as a victim or complainant" });
  return f;
}

/** Turns one extracted entity into a graph entity. The id is made unique by the caller. */
export function buildEntity(e: NlpEntity, id: string, caseId: string, source: string, origin: EntityOrigin = "nlp"): Entity {
  const factors = factorsFor(e, source, origin);
  const riskScore = Math.max(0, Math.min(100, factors.reduce((s, x) => s + x.points, 0)));
  const now = new Date().toISOString();
  const base = {
    id,
    name: e.label,
    riskScore,
    riskLevel: levelFor(riskScore) as Entity["riskLevel"],
    caseIds: [caseId],
    tags: [origin === "list" ? "imported" : "nlp-extracted", ...e.tags],
    createdAt: now,
    summary: origin === "list" ? `Listed in ${source}.` : `Extracted from ${source}.`,
    role:
      origin === "list"
        ? "Listed in the import file"
        : e.tags.includes("accused")
          ? "Described as accused in the source text"
          : e.tags.includes("victim")
            ? "Described as a victim in the source text"
            : "Named in the source text",
    riskFactors: factors,
    description:
      origin === "list"
        ? `Named in the file ${source} for this case. Check the source before relying on it.`
        : `Found by the NLP engine in ${source} (confidence ${e.confidence}%). Check the source before relying on it.`,
  };
  switch (e.type) {
    case "person":
      return { ...base, type: "person", aliases: e.aliases, dob: "", address: "Not stated in the source text", nationality: "", occupation: "", criminalHistory: [], photoInitials: initials(e.label) };
    case "phone":
      return { ...base, type: "phone", number: e.label, carrier: "Unknown", firstSeen: now.slice(0, 10), lastSeen: now.slice(0, 10) };
    case "vehicle":
      return { ...base, type: "vehicle", plate: e.label, make: "Unknown", model: "", color: "" };
    case "organization":
      return { ...base, type: "organization", orgType: "Not stated", registeredAddress: "", incorporatedOn: "", knownMemberIds: [] };
    case "location":
      return { ...base, type: "location", address: e.label, locationType: "Extracted from text", coordinates: { lat: 20.5937, lng: 78.9629 } };
    case "financial_account":
      return { ...base, type: "financial_account", accountNumber: e.label, bank: "", accountType: "Not stated", balanceEstimate: 0 };
  }
}

export function buildRelationship(r: NlpRelationship, id: string, sourceId: string, targetId: string, caseId: string, source: string): Relationship {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    type: r.type,
    sourceId,
    targetId,
    strength: r.strength,
    frequency: r.frequency,
    startDate: today,
    endDate: today,
    evidenceSource: `NLP extraction — ${source}`,
    caseId,
    confidence: r.confidence,
    note: r.evidence,
  };
}
