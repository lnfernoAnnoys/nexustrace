import { ENTITY_TYPE_LABEL, ENTITY_TYPE_COLOR, RELATIONSHIP_TYPE_LABEL, RELATIONSHIP_TYPE_COLOR } from "@/data";
import type { EntityType, RelationshipType } from "@/types";

const ENTITY_TYPES: EntityType[] = ["person", "phone", "vehicle", "organization", "location", "financial_account"];
const REL_TYPES: RelationshipType[] = ["call", "financial_transaction", "association", "co_location", "family", "business"];

export function GraphLegend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-2 rounded-lg border border-border bg-panel/90 glass px-3 py-2.5 text-[10px] text-text-secondary">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {ENTITY_TYPES.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: ENTITY_TYPE_COLOR[t] }} />
            {ENTITY_TYPE_LABEL[t]}
          </span>
        ))}
      </div>
      <div className="h-px bg-border" />
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {REL_TYPES.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="h-[2px] w-3" style={{ backgroundColor: RELATIONSHIP_TYPE_COLOR[t] }} />
            {RELATIONSHIP_TYPE_LABEL[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
