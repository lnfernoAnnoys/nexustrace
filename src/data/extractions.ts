import type { EntityType, RelationshipType } from "@/types";

export interface ExtractedEntityMock {
  label: string;
  type: EntityType;
  confidence: number;
  entityId?: string;
}

export interface ExtractedRelationshipMock {
  label: string;
  confidence: number;
  newRelationship?: {
    type: RelationshipType;
    sourceId: string;
    targetId: string;
    strength: number;
  };
}

export interface MockExtraction {
  entities: ExtractedEntityMock[];
  relationships: ExtractedRelationshipMock[];
}

export const EXTRACTION_RESULTS: Record<string, MockExtraction> = {
  ev01: {
    entities: [
      { label: "Rohan Verma", type: "person", confidence: 97, entityId: "p01" },
      { label: "Sunil Kadam", type: "person", confidence: 91, entityId: "p03" },
      { label: "Sector 21, Gurugram, Haryana", type: "location", confidence: 88, entityId: "l01" },
      { label: "DL-01-AB-4471", type: "vehicle", confidence: 94, entityId: "v01" },
      { label: "Ashoka Enclave, Faridabad", type: "location", confidence: 71 },
    ],
    relationships: [
      { label: "Rohan Verma coordinating with Sunil Kadam", confidence: 89 },
      { label: "Rohan Verma associated with vehicle DL-01-AB-4471", confidence: 93 },
    ],
  },
  ev03: {
    entities: [
      { label: "Rohan Verma", type: "person", confidence: 96, entityId: "p01" },
      { label: "Ehsaan Qureshi", type: "person", confidence: 84, entityId: "p07" },
      { label: "Riverside Farmhouse, Sonipat", type: "location", confidence: 90, entityId: "l05" },
      { label: "RJ-14-QF-3390", type: "vehicle", confidence: 92, entityId: "v06" },
      { label: "Meera Iyer", type: "person", confidence: 68, entityId: "p13" },
    ],
    relationships: [
      { label: "Rohan Verma met Ehsaan Qureshi at the farmhouse", confidence: 90 },
      {
        label: "New link — Meera Iyer co-located with Riverside Farmhouse, Sonipat",
        confidence: 82,
        newRelationship: { type: "co_location", sourceId: "p13", targetId: "l05", strength: 5 },
      },
    ],
  },
  ev04: {
    entities: [
      { label: "Aditya Malhotra", type: "person", confidence: 95, entityId: "p02" },
      { label: "HDFC •••1187", type: "financial_account", confidence: 93, entityId: "f01" },
      { label: "Oberoi Bullion & Forex", type: "organization", confidence: 87, entityId: "o05" },
      { label: "Oberoi Trading •••2214", type: "financial_account", confidence: 90, entityId: "f05" },
    ],
    relationships: [
      { label: "Recurring transfer pattern — Aditya Malhotra to Oberoi Bullion & Forex", confidence: 91 },
    ],
  },
  ev06: {
    entities: [
      { label: "QuickCash Fintech Solutions", type: "organization", confidence: 89, entityId: "o04" },
      { label: "Sector 63, Noida", type: "location", confidence: 80, entityId: "l04" },
      { label: "Naveen Reddy (alias match)", type: "person", confidence: 66, entityId: "p09" },
    ],
    relationships: [
      { label: "Victim complaints trace loan app to QuickCash Fintech Solutions", confidence: 85 },
      {
        label: "New link — Arjun Bhatt and Nikhil Bansal share a mutual social media connection, previously unlinked in the network",
        confidence: 60,
        newRelationship: { type: "association", sourceId: "p11", targetId: "p17", strength: 3 },
      },
    ],
  },
};
