import type { Entity, EntityType, Relationship, RelationshipType } from "@/types";

// A made-up network with no names, only used as a moving backdrop on the sign-in page. It contains none of the real case data.
const TYPES: EntityType[] = ["person", "person", "person", "organization", "location", "financial_account", "vehicle", "phone"];
const LINKS: RelationshipType[] = ["call", "association", "financial_transaction", "business", "co_location"];

function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function decorativeGraph(nodeCount = 46): { entities: Entity[]; relationships: Relationship[] } {
  const rnd = makeRandom(7);
  const entities: Entity[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const type = TYPES[Math.floor(rnd() * TYPES.length)];
    const riskScore = Math.round(rnd() * 100);
    // only the fields the graph draws are filled in
    entities.push({
      id: `d${i}`,
      type,
      name: "",
      riskScore,
      riskLevel: riskScore >= 85 ? "critical" : riskScore >= 65 ? "high" : riskScore >= 40 ? "medium" : "low",
      caseIds: [],
      createdAt: "",
      summary: "",
    } as unknown as Entity);
  }
  const relationships: Relationship[] = [];
  for (let i = 1; i < nodeCount; i++) {
    const to = Math.floor(rnd() * i);
    relationships.push({
      id: `dr${i}`,
      type: LINKS[Math.floor(rnd() * LINKS.length)],
      sourceId: `d${i}`,
      targetId: `d${to}`,
      strength: 2 + Math.floor(rnd() * 6),
      frequency: 1,
      startDate: "",
      endDate: "",
      evidenceSource: "",
      caseId: "",
      confidence: 80,
    });
  }
  for (let i = 0; i < nodeCount / 3; i++) {
    const a = Math.floor(rnd() * nodeCount);
    const b = Math.floor(rnd() * nodeCount);
    if (a !== b) {
      relationships.push({
        id: `dx${i}`,
        type: LINKS[Math.floor(rnd() * LINKS.length)],
        sourceId: `d${a}`,
        targetId: `d${b}`,
        strength: 2 + Math.floor(rnd() * 5),
        frequency: 1,
        startDate: "",
        endDate: "",
        evidenceSource: "",
        caseId: "",
        confidence: 75,
      });
    }
  }
  return { entities, relationships };
}
