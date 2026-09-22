import type { CaseRecord, Entity, EvidenceDocument, Relationship, SocialPresence, TimelineEvent } from "../../src/types/index.ts";
import { cases } from "./cases.ts";
import { entities } from "./entities.ts";
import { evidenceDocuments } from "./evidence.ts";
import { events } from "./events.ts";
import { relationships } from "./relationships.ts";
import { fetchedOn, social } from "./social.ts";

export interface Dataset {
  cases: CaseRecord[];
  entities: Entity[];
  relationships: Relationship[];
  events: TimelineEvent[];
  evidence: EvidenceDocument[];
  /** Documented official accounts of public figures and organisations (see fetch-social.ts). */
  social: SocialPresence[];
  /** Date the social data was fetched from Wikidata. */
  socialFetchedOn: string;
}

export const dataset: Dataset = { cases, entities, relationships, events, evidence: evidenceDocuments, social, socialFetchedOn: fetchedOn };

// A dataset that points at something that does not exist would show blank cards, so check it when the server starts.
export function checkDataset(d: Dataset = dataset): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const e of d.entities) {
    if (ids.has(e.id)) problems.push(`duplicate entity id ${e.id}`);
    ids.add(e.id);
  }
  const caseIds = new Set(d.cases.map((c) => c.id));
  for (const e of d.entities) for (const c of e.caseIds) if (!caseIds.has(c)) problems.push(`entity ${e.id} is in unknown case ${c}`);
  for (const r of d.relationships) {
    if (!ids.has(r.sourceId)) problems.push(`relationship ${r.id}: unknown source ${r.sourceId}`);
    if (!ids.has(r.targetId)) problems.push(`relationship ${r.id}: unknown target ${r.targetId}`);
    if (!caseIds.has(r.caseId)) problems.push(`relationship ${r.id}: unknown case ${r.caseId}`);
  }
  for (const ev of d.events) {
    if (!caseIds.has(ev.caseId)) problems.push(`event ${ev.id}: unknown case ${ev.caseId}`);
    for (const id of ev.entityIds) if (!ids.has(id)) problems.push(`event ${ev.id}: unknown entity ${id}`);
  }
  for (const doc of d.evidence) if (!caseIds.has(doc.caseId)) problems.push(`document ${doc.id}: unknown case ${doc.caseId}`);
  for (const s of d.social) {
    const e = d.entities.find((x) => x.id === s.entityId);
    if (!e) problems.push(`social entry for unknown entity ${s.entityId}`);
    else if (e.type !== "person" && e.type !== "organization") problems.push(`social entry for ${s.entityId}: only people and organisations are listed`);
  }
  return problems;
}
