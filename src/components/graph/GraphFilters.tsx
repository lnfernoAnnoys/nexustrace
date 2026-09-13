import type { EntityType, RelationshipType, CaseRecord } from "@/types";
import type { GraphLayout } from "./NetworkGraph";
import { ENTITY_TYPE_LABEL, ENTITY_TYPE_COLOR, RELATIONSHIP_TYPE_LABEL, RELATIONSHIP_TYPE_COLOR } from "@/data";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_ENTITY_TYPES: EntityType[] = ["person", "phone", "vehicle", "organization", "location", "financial_account"];
const ALL_REL_TYPES: RelationshipType[] = ["call", "sms", "financial_transaction", "association", "co_location", "vehicle_ownership", "family", "business"];

export interface GraphFilterState {
  entityTypes: Set<EntityType>;
  relTypes: Set<RelationshipType>;
  minStrength: number;
  caseId: string;
}

export function GraphFilters({
  state,
  onChange,
  layout,
  onLayoutChange,
  keyPlayersMode,
  onToggleKeyPlayers,
  findConnectionMode,
  onToggleFindConnection,
  cases,
  showCaseFilter = false,
}: {
  state: GraphFilterState;
  onChange: (s: GraphFilterState) => void;
  layout: GraphLayout;
  onLayoutChange: (l: GraphLayout) => void;
  keyPlayersMode: boolean;
  onToggleKeyPlayers: (v: boolean) => void;
  findConnectionMode: boolean;
  onToggleFindConnection: (v: boolean) => void;
  cases?: CaseRecord[];
  showCaseFilter?: boolean;
}) {
  function toggleEntityType(t: EntityType) {
    const next = new Set(state.entityTypes);
    next.has(t) ? next.delete(t) : next.add(t);
    onChange({ ...state, entityTypes: next });
  }
  function toggleRelType(t: RelationshipType) {
    const next = new Set(state.relTypes);
    next.has(t) ? next.delete(t) : next.add(t);
    onChange({ ...state, relTypes: next });
  }

  return (
    <div className="flex flex-col gap-5 text-xs">
      {showCaseFilter && cases && (
        <div>
          <Label className="mb-1.5 block">Case</Label>
          <Select value={state.caseId} onValueChange={(v) => onChange({ ...state, caseId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              {cases.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="mb-2 block">Layout</Label>
        <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-panel p-1">
          {(["force", "circular", "risk"] as GraphLayout[]).map((l) => (
            <button
              key={l}
              onClick={() => onLayoutChange(l)}
              className={cn(
                "rounded px-1.5 py-1 text-[11px] capitalize transition-colors",
                layout === l ? "bg-cyan-500/15 text-cyan-300" : "text-text-secondary hover:bg-panel-hover",
              )}
            >
              {l === "risk" ? "Risk Rings" : l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Key Players</Label>
        <Switch checked={keyPlayersMode} onCheckedChange={onToggleKeyPlayers} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Find Connection</Label>
        <Switch checked={findConnectionMode} onCheckedChange={onToggleFindConnection} />
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block">Minimum Connection Strength</Label>
        <Slider min={1} max={10} step={1} value={[state.minStrength]} onValueChange={([v]) => onChange({ ...state, minStrength: v })} />
        <p className="mt-1 mono text-[10px] text-text-muted">≥ {state.minStrength} / 10</p>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block">Entity Types</Label>
        <div className="flex flex-col gap-1.5">
          {ALL_ENTITY_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 hover:bg-panel-hover">
              <input
                type="checkbox"
                checked={state.entityTypes.has(t)}
                onChange={() => toggleEntityType(t)}
                className="sr-only"
              />
              <span
                className="flex size-3.5 items-center justify-center rounded-sm border"
                style={{
                  borderColor: ENTITY_TYPE_COLOR[t],
                  backgroundColor: state.entityTypes.has(t) ? ENTITY_TYPE_COLOR[t] : "transparent",
                }}
              />
              <span className="text-text-secondary">{ENTITY_TYPE_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block">Relationship Types</Label>
        <div className="flex flex-col gap-1.5">
          {ALL_REL_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 hover:bg-panel-hover">
              <input
                type="checkbox"
                checked={state.relTypes.has(t)}
                onChange={() => toggleRelType(t)}
                className="sr-only"
              />
              <span
                className="flex size-3.5 items-center justify-center rounded-sm border"
                style={{
                  borderColor: RELATIONSHIP_TYPE_COLOR[t],
                  backgroundColor: state.relTypes.has(t) ? RELATIONSHIP_TYPE_COLOR[t] : "transparent",
                }}
              />
              <span className="text-text-secondary">{RELATIONSHIP_TYPE_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function defaultGraphFilterState(caseId = "all"): GraphFilterState {
  return {
    entityTypes: new Set(ALL_ENTITY_TYPES),
    relTypes: new Set(ALL_REL_TYPES),
    minStrength: 1,
    caseId,
  };
}
