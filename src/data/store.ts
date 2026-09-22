// The case data lives on the server and is only sent after sign-in (GET /api/dataset). These arrays start empty and
// are filled in place by loader.ts, so every page can keep importing them from "@/data".
import { useSyncExternalStore } from "react";
import type {
  AIAlert,
  CaseRecord,
  Entity,
  EvidenceDocument,
  FinancialAccountEntity,
  LocationEntity,
  OrganizationEntity,
  PersonEntity,
  PhoneEntity,
  Relationship,
  SocialPresence,
  TimelineEvent,
  VehicleEntity,
} from "@/types";

export const allEntities: Entity[] = [];
export const entityById = new Map<string, Entity>();
export const people: PersonEntity[] = [];
export const phones: PhoneEntity[] = [];
export const vehicles: VehicleEntity[] = [];
export const organizations: OrganizationEntity[] = [];
export const locations: LocationEntity[] = [];
export const financialAccounts: FinancialAccountEntity[] = [];
export const relationships: Relationship[] = [];
export const cases: CaseRecord[] = [];
export const events: TimelineEvent[] = [];
export const alerts: AIAlert[] = [];
export const evidenceDocuments: EvidenceDocument[] = [];
export const socialPresence: SocialPresence[] = [];
/** When the social data was fetched (set by fillStore). */
export const socialInfo = { fetchedOn: "" };

export interface DatasetPayload {
  cases: CaseRecord[];
  entities: Entity[];
  relationships: Relationship[];
  events: TimelineEvent[];
  evidence: EvidenceDocument[];
  social: SocialPresence[];
  socialFetchedOn: string;
}

// --- change notification: pages that show the data re-render when it changes -------------------------

let version = 0;
const listeners = new Set<() => void>();

export function bumpData(): void {
  version++;
  for (const l of listeners) l();
}

/** Re-renders the calling component whenever the dataset is loaded, cleared or extended. */
export function useDataVersion(): number {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => version,
  );
}

// --- filling and emptying ----------------------------------------------------------------------------

function indexEntity(e: Entity): void {
  allEntities.push(e);
  entityById.set(e.id, e);
  switch (e.type) {
    case "person":
      people.push(e);
      break;
    case "phone":
      phones.push(e);
      break;
    case "vehicle":
      vehicles.push(e);
      break;
    case "organization":
      organizations.push(e);
      break;
    case "location":
      locations.push(e);
      break;
    case "financial_account":
      financialAccounts.push(e);
      break;
  }
}

function syncCaseMembers(): void {
  for (const c of cases) c.entityIds = allEntities.filter((e) => e.caseIds.includes(c.id)).map((e) => e.id);
}

export function clearStore(): void {
  for (const list of [allEntities, people, phones, vehicles, organizations, locations, financialAccounts, relationships, cases, events, alerts, evidenceDocuments, socialPresence] as unknown[][]) {
    list.length = 0;
  }
  entityById.clear();
  socialInfo.fetchedOn = "";
}

export function fillStore(d: DatasetPayload): void {
  clearStore();
  cases.push(...d.cases);
  for (const e of d.entities) indexEntity(e);
  relationships.push(...d.relationships);
  events.push(...d.events);
  evidenceDocuments.push(...d.evidence);
  socialPresence.push(...d.social);
  socialInfo.fetchedOn = d.socialFetchedOn;
  syncCaseMembers();
}

/**
 * Adds many cases at once (from an imported file) with the entities and links made for them. `touches` lists existing
 * graph entities that were named by a new case, so they become part of it too. Notifies once, at the end.
 */
export function addBulk(newCases: CaseRecord[], newEntities: Entity[], newRelationships: Relationship[], touches: Map<string, string[]>): void {
  cases.unshift(...newCases);
  for (const e of newEntities) if (!entityById.has(e.id)) indexEntity(e);
  for (const [id, caseIds] of touches) {
    const e = entityById.get(id);
    if (e) e.caseIds = [...new Set([...e.caseIds, ...caseIds])];
  }
  relationships.push(...newRelationships);
  syncCaseMembers();
  bumpData();
}

/** Adds what the NLP extracted (after a person confirmed it): new entities, links, and existing entities newly tied to the case. */
export function addToCase(caseId: string, newEntities: Entity[], newRelationships: Relationship[], existingIds: string[]): void {
  for (const e of newEntities) if (!entityById.has(e.id)) indexEntity(e);
  for (const id of existingIds) {
    const e = entityById.get(id);
    if (e && !e.caseIds.includes(caseId)) e.caseIds = [...e.caseIds, caseId];
  }
  relationships.push(...newRelationships);
  syncCaseMembers();
  bumpData();
}
