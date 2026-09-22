import type { Entity, Relationship } from "@/types";
import { api } from "@/lib/api";
import { refreshAlerts } from "./index";
import { addToCase, allEntities, bumpData, clearStore, fillStore, type DatasetPayload } from "./store";

let loading: Promise<void> | null = null;

/** Fetches the case data once after sign-in. Safe to call again: it does nothing if the data is already there. */
export function ensureDataset(): Promise<void> {
  if (allEntities.length > 0) return Promise.resolve();
  loading ??= api<DatasetPayload>("/dataset")
    .then((d) => {
      fillStore(d);
      refreshAlerts();
      bumpData();
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Forget everything (on sign-out) so the next person to use this browser tab starts with nothing. */
export function clearDataset(): void {
  clearStore();
  bumpData();
}

/** Add reviewed NLP results to a case, then refresh the findings computed from the graph. */
export function commitExtraction(caseId: string, entities: Entity[], relationships: Relationship[], existingIds: string[]): void {
  addToCase(caseId, entities, relationships, existingIds);
  refreshAlerts();
  bumpData();
}
