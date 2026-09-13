import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Share2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetworkGraph, type NetworkGraphHandle, type GraphLayout } from "@/components/graph/NetworkGraph";
import { GraphFilters, defaultGraphFilterState } from "@/components/graph/GraphFilters";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { KeyPlayersPanel } from "@/components/graph/KeyPlayersPanel";
import { EntityIconBadge } from "@/components/shared/EntityIcon";
import { allEntities, relationships as allRelationships, cases, computeCentrality, getEntitiesForCase, getRelationshipsForCase, getEntity } from "@/data";
import { findShortestPath } from "@/data";

function pathToEdgeIds(path: string[], rels: { id: string; sourceId: string; targetId: string }[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const rel = rels.find((r) => (r.sourceId === a && r.targetId === b) || (r.sourceId === b && r.targetId === a));
    if (rel) set.add(rel.id);
  }
  return set;
}

export default function NetworkExplorer() {
  const [searchParams] = useSearchParams();
  const graphRef = useRef<NetworkGraphHandle>(null);
  const [filterState, setFilterState] = useState(defaultGraphFilterState());
  const [layout, setLayout] = useState<GraphLayout>("force");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(searchParams.get("focus"));
  const [keyPlayersMode, setKeyPlayersMode] = useState(false);
  const [findConnectionMode, setFindConnectionMode] = useState(false);
  const [connectionPick, setConnectionPick] = useState<string[]>([]);
  const [pathResult, setPathResult] = useState<string[] | null | undefined>(undefined);

  const scopedEntities = useMemo(
    () => (filterState.caseId === "all" ? allEntities : getEntitiesForCase(filterState.caseId)),
    [filterState.caseId],
  );
  const scopedRelationships = useMemo(
    () => (filterState.caseId === "all" ? allRelationships : getRelationshipsForCase(filterState.caseId)),
    [filterState.caseId],
  );

  const filteredEntities = useMemo(
    () => scopedEntities.filter((e) => filterState.entityTypes.has(e.type)),
    [scopedEntities, filterState.entityTypes],
  );
  const filteredRelationships = useMemo(
    () => scopedRelationships.filter((r) => filterState.relTypes.has(r.type) && r.strength >= filterState.minStrength),
    [scopedRelationships, filterState.relTypes, filterState.minStrength],
  );

  const centrality = useMemo(
    () => computeCentrality(scopedEntities.map((e) => e.id), scopedRelationships),
    [scopedEntities, scopedRelationships],
  );

  function handleSelectNode(id: string | null) {
    if (!findConnectionMode || id === null) {
      setSelectedNodeId(id);
      return;
    }
    if (connectionPick.length === 0) {
      setConnectionPick([id]);
      setPathResult(undefined);
    } else if (connectionPick.length === 1) {
      if (connectionPick[0] === id) return;
      const path = findShortestPath(connectionPick[0], id, filteredRelationships);
      setConnectionPick([connectionPick[0], id]);
      setPathResult(path);
    } else {
      setConnectionPick([id]);
      setPathResult(undefined);
    }
  }

  const pathNodeIds = useMemo(() => (pathResult ? new Set(pathResult) : undefined), [pathResult]);
  const pathEdgeIds = useMemo(
    () => (pathResult ? pathToEdgeIds(pathResult, filteredRelationships) : undefined),
    [pathResult, filteredRelationships],
  );
  const keyPlayerIds = useMemo(
    () => (keyPlayersMode ? new Set(centrality.slice(0, 6).map((c) => c.entity.id)) : undefined),
    [keyPlayersMode, centrality],
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-3">
      <div>
        <h1 className="text-lg font-semibold text-text">Network Explorer</h1>
        <p className="text-xs text-text-secondary">Cross-case relationship graph — every tracked entity and connection</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[240px_1fr_320px]">
        <Card className="overflow-y-auto p-3.5">
          <GraphFilters
            state={filterState}
            onChange={setFilterState}
            layout={layout}
            onLayoutChange={setLayout}
            keyPlayersMode={keyPlayersMode}
            onToggleKeyPlayers={(v) => { setKeyPlayersMode(v); if (v) setFindConnectionMode(false); }}
            findConnectionMode={findConnectionMode}
            onToggleFindConnection={(v) => {
              setFindConnectionMode(v);
              if (v) setKeyPlayersMode(false);
              setConnectionPick([]);
              setPathResult(undefined);
            }}
            cases={cases}
            showCaseFilter
          />
        </Card>

        <Card className="relative min-h-0 overflow-hidden p-0">
          <div className="absolute right-3 top-3 z-10">
            <Button size="sm" variant="secondary" onClick={() => graphRef.current?.zoomToFit()}>
              <RotateCcw size={12} /> Reset View
            </Button>
          </div>
          <NetworkGraph
            ref={graphRef}
            entities={filteredEntities}
            relationships={filteredRelationships}
            selectedId={selectedNodeId}
            onSelectNode={handleSelectNode}
            layout={layout}
            highlightIds={keyPlayerIds}
            pathNodeIds={pathNodeIds}
            pathEdgeIds={pathEdgeIds}
            height="100%"
          />
          <GraphLegend />
        </Card>

        <Card className="overflow-y-auto p-0">
          {findConnectionMode ? (
            <div className="p-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-cyan-300">Find Connection</p>
              <p className="mb-3 text-xs text-text-secondary">Click two nodes to reveal the shortest path between them across the network.</p>
              <div className="flex flex-col gap-2">
                {[0, 1].map((i) => {
                  const id = connectionPick[i];
                  const e = id ? getEntity(id) : undefined;
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-panel-hover/30 px-2.5 py-2">
                      <span className="mono text-[10px] text-text-muted">{i === 0 ? "A" : "B"}</span>
                      {e ? (
                        <>
                          <EntityIconBadge type={e.type} size={22} />
                          <span className="text-xs text-text">{e.name}</span>
                        </>
                      ) : (
                        <span className="text-xs text-text-muted">Click a node…</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {pathResult !== undefined && (
                <div className="mt-4 border-t border-border pt-3">
                  {pathResult === null ? (
                    <p className="text-xs text-red">No path found within the current filters.</p>
                  ) : (
                    <>
                      <p className="mb-2 text-xs text-green">
                        Path found — {pathResult.length - 1} hop{pathResult.length - 1 === 1 ? "" : "s"}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {pathResult.map((id, i) => {
                          const e = getEntity(id);
                          if (!e) return null;
                          return (
                            <div key={id} className="flex items-center gap-2 text-xs text-text-secondary">
                              <span className="mono w-4 text-[10px] text-text-muted">{i + 1}</span>
                              <EntityIconBadge type={e.type} size={22} />
                              {e.name}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : keyPlayersMode ? (
            <div className="p-4">
              <KeyPlayersPanel rows={centrality} activeId={selectedNodeId} onSelect={setSelectedNodeId} />
            </div>
          ) : selectedNodeId ? (
            <NodeDetailPanel entityId={selectedNodeId} onClose={() => setSelectedNodeId(null)} onFocusEntity={setSelectedNodeId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <Share2 size={24} className="text-text-muted" />
              <p className="text-xs text-text-muted">Click any node to inspect it, or enable Key Players / Find Connection.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
