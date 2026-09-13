import type { Entity, EntityType, Relationship, RiskLevel } from "@/types";
import { allEntities, entityById, people, phones, vehicles, organizations, locations, financialAccounts } from "./entities";
import { relationships } from "./relationships";
import { cases } from "./cases";
import { events } from "./events";
import { alerts } from "./alerts";
import { evidenceDocuments } from "./evidence";

export {
  allEntities,
  entityById,
  people,
  phones,
  vehicles,
  organizations,
  locations,
  financialAccounts,
  relationships,
  cases,
  events,
  alerts,
  evidenceDocuments,
};

// Populate each case's entityIds from the entities that declare membership in it,
// so the two stay in sync without hand-maintaining both sides.
for (const c of cases) {
  c.entityIds = allEntities.filter((e) => e.caseIds.includes(c.id)).map((e) => e.id);
}

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  person: "Person",
  phone: "Phone Number",
  vehicle: "Vehicle",
  organization: "Organization",
  location: "Location",
  financial_account: "Financial Account",
};

export const ENTITY_TYPE_COLOR: Record<EntityType, string> = {
  person: "#22d3ee",
  phone: "#a78bfa",
  vehicle: "#fb923c",
  organization: "#60a5fa",
  location: "#34d399",
  financial_account: "#f59e0b",
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: "#34d399",
  medium: "#f59e0b",
  high: "#fb923c",
  critical: "#f43f5e",
};

export const RELATIONSHIP_TYPE_LABEL: Record<Relationship["type"], string> = {
  call: "Phone Call",
  sms: "SMS",
  financial_transaction: "Financial Transaction",
  association: "Association",
  co_location: "Co-location",
  vehicle_ownership: "Vehicle Ownership",
  family: "Family",
  business: "Business",
};

export const RELATIONSHIP_TYPE_COLOR: Record<Relationship["type"], string> = {
  call: "#22d3ee",
  sms: "#67e8f9",
  financial_transaction: "#f59e0b",
  association: "#93a1b8",
  co_location: "#34d399",
  vehicle_ownership: "#fb923c",
  family: "#f472b6",
  business: "#60a5fa",
};

export const RELATIONSHIP_TYPE_DASH: Record<Relationship["type"], number[] | null> = {
  call: null,
  sms: [1, 3],
  financial_transaction: [6, 3],
  association: [1, 4],
  co_location: null,
  vehicle_ownership: null,
  family: [8, 0],
  business: [6, 3],
};

export function getEntity(id: string): Entity | undefined {
  return entityById.get(id);
}

export function getCase(id: string) {
  return cases.find((c) => c.id === id);
}

export function getEntitiesForCase(caseId: string): Entity[] {
  return allEntities.filter((e) => e.caseIds.includes(caseId));
}

export function getRelationshipsForCase(caseId: string): Relationship[] {
  return relationships.filter((r) => r.caseId === caseId);
}

export function getRelationshipsForEntity(entityId: string): Relationship[] {
  return relationships.filter((r) => r.sourceId === entityId || r.targetId === entityId);
}

export function getEventsForCase(caseId: string) {
  return events.filter((e) => e.caseId === caseId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getEventsForEntity(entityId: string) {
  return events.filter((e) => e.entityIds.includes(entityId)).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getAlertsForCase(caseId: string) {
  return alerts.filter((a) => a.caseId === caseId);
}

export function getEvidenceForCase(caseId: string) {
  return evidenceDocuments.filter((d) => d.caseId === caseId);
}

export function connectedEntityIds(entityId: string, rels: Relationship[] = relationships): string[] {
  const set = new Set<string>();
  for (const r of rels) {
    if (r.sourceId === entityId) set.add(r.targetId);
    if (r.targetId === entityId) set.add(r.sourceId);
  }
  return [...set];
}

export interface CentralityRow {
  entity: Entity;
  degree: number;
  betweenness: number;
}

/** Degree centrality plus a lightweight betweenness approximation (all-pairs BFS shortest-path counting) over a given relationship subset. */
export function computeCentrality(entityIds: string[], rels: Relationship[]): CentralityRow[] {
  const adjacency = new Map<string, Set<string>>();
  for (const id of entityIds) adjacency.set(id, new Set());
  for (const r of rels) {
    adjacency.get(r.sourceId)?.add(r.targetId);
    adjacency.get(r.targetId)?.add(r.sourceId);
  }

  const betweenness = new Map<string, number>(entityIds.map((id) => [id, 0]));

  for (const source of entityIds) {
    const prevMap = new Map<string, string[]>();
    const dist = new Map<string, number>([[source, 0]]);
    const queue: string[] = [source];
    const order: string[] = [];
    while (queue.length) {
      const u = queue.shift()!;
      order.push(u);
      for (const v of adjacency.get(u) ?? []) {
        if (!dist.has(v)) {
          dist.set(v, dist.get(u)! + 1);
          queue.push(v);
        }
        if (dist.get(v) === dist.get(u)! + 1) {
          prevMap.set(v, [...(prevMap.get(v) ?? []), u]);
        }
      }
    }
    const dependency = new Map<string, number>(entityIds.map((id) => [id, 0]));
    for (let i = order.length - 1; i >= 0; i--) {
      const w = order[i];
      for (const v of prevMap.get(w) ?? []) {
        const share = 1 + (dependency.get(w) ?? 0);
        dependency.set(v, (dependency.get(v) ?? 0) + share);
      }
      if (w !== source) {
        betweenness.set(w, (betweenness.get(w) ?? 0) + (dependency.get(w) ?? 0));
      }
    }
  }

  return entityIds
    .map((id) => ({
      entity: getEntity(id)!,
      degree: adjacency.get(id)?.size ?? 0,
      betweenness: Math.round((betweenness.get(id) ?? 0) / 2),
    }))
    .filter((row) => row.entity)
    .sort((a, b) => b.degree - a.degree || b.betweenness - a.betweenness);
}

/** BFS shortest path between two entities over a given relationship subset. Returns the ordered chain of entity ids, or null if unreachable. */
export function findShortestPath(sourceId: string, targetId: string, rels: Relationship[] = relationships): string[] | null {
  if (sourceId === targetId) return [sourceId];
  const adjacency = new Map<string, string[]>();
  for (const r of rels) {
    if (!adjacency.has(r.sourceId)) adjacency.set(r.sourceId, []);
    if (!adjacency.has(r.targetId)) adjacency.set(r.targetId, []);
    adjacency.get(r.sourceId)!.push(r.targetId);
    adjacency.get(r.targetId)!.push(r.sourceId);
  }
  const visited = new Set([sourceId]);
  const queue: string[][] = [[sourceId]];
  while (queue.length) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    if (node === targetId) return path;
    for (const next of adjacency.get(node) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}
