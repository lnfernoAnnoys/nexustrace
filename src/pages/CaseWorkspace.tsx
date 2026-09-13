import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  UploadCloud,
  Users,
  Share2,
  ShieldAlert,
  Sparkles,
  Phone,
  Landmark,
  Eye,
  Video,
  Siren,
  RotateCcw,
  Search,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EntityIconBadge } from "@/components/shared/EntityIcon";
import { AlertCard } from "@/components/shared/AlertCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { NetworkGraph, type NetworkGraphHandle, type GraphLayout } from "@/components/graph/NetworkGraph";
import { GraphFilters, defaultGraphFilterState, type GraphFilterState } from "@/components/graph/GraphFilters";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { KeyPlayersPanel } from "@/components/graph/KeyPlayersPanel";
import { AIExtractionModal } from "@/components/evidence/AIExtractionModal";
import {
  getCase,
  getEntitiesForCase,
  getRelationshipsForCase,
  getEventsForCase,
  getAlertsForCase,
  getEvidenceForCase,
  computeCentrality,
  findShortestPath,
  getEntity,
  ENTITY_TYPE_LABEL,
} from "@/data";
import type { EntityType, EvidenceDocument, Relationship, EventType } from "@/types";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

const EVENT_ICON: Record<EventType, typeof Phone> = {
  call: Phone,
  transaction: Landmark,
  sighting: Eye,
  meeting: Users,
  arrest: Siren,
  filing: FileText,
  surveillance: Video,
};

const EVIDENCE_TYPE_LABEL: Record<EvidenceDocument["type"], string> = {
  fir: "FIR / Police Report",
  cdr: "Call Detail Record",
  financial_record: "Financial Record",
  surveillance_report: "Surveillance Report",
  social_media: "Social Media Intelligence",
  criminal_history: "Criminal History",
  intelligence_report: "Intelligence Report",
};

function pathToEdgeIds(path: string[], rels: Relationship[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const rel = rels.find((r) => (r.sourceId === a && r.targetId === b) || (r.sourceId === b && r.targetId === a));
    if (rel) set.add(rel.id);
  }
  return set;
}

export default function CaseWorkspace() {
  const { caseId = "" } = useParams();
  const caseRecord = getCase(caseId);

  const [extraRelationships, setExtraRelationships] = useState<Relationship[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDocument | null>(null);
  const [alertOverrides, setAlertOverrides] = useState<Record<string, boolean>>({});
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "all">("all");
  const [query, setQuery] = useState("");

  const graphRef = useRef<NetworkGraphHandle>(null);
  const [filterState, setFilterState] = useState<GraphFilterState>(defaultGraphFilterState());
  const [layout, setLayout] = useState<GraphLayout>("force");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [keyPlayersMode, setKeyPlayersMode] = useState(false);
  const [findConnectionMode, setFindConnectionMode] = useState(false);
  const [connectionPick, setConnectionPick] = useState<string[]>([]);
  const [pathResult, setPathResult] = useState<string[] | null | undefined>(undefined);

  const caseEntities = useMemo(() => (caseRecord ? getEntitiesForCase(caseRecord.id) : []), [caseRecord]);
  const baseRelationships = useMemo(() => (caseRecord ? getRelationshipsForCase(caseRecord.id) : []), [caseRecord]);
  const relationships = useMemo(
    () => [...baseRelationships, ...extraRelationships.filter((r) => r.caseId === caseId)],
    [baseRelationships, extraRelationships, caseId],
  );
  const events = useMemo(() => (caseRecord ? getEventsForCase(caseRecord.id) : []), [caseRecord]);
  const alerts = useMemo(() => (caseRecord ? getAlertsForCase(caseRecord.id) : []), [caseRecord]);
  const evidenceDocs = useMemo(() => (caseRecord ? getEvidenceForCase(caseRecord.id) : []), [caseRecord]);

  const filteredEntities = useMemo(
    () => caseEntities.filter((e) => filterState.entityTypes.has(e.type)),
    [caseEntities, filterState.entityTypes],
  );
  const filteredRelationships = useMemo(
    () =>
      relationships.filter(
        (r) => filterState.relTypes.has(r.type) && r.strength >= filterState.minStrength,
      ),
    [relationships, filterState.relTypes, filterState.minStrength],
  );

  const centrality = useMemo(
    () => computeCentrality(caseEntities.map((e) => e.id), relationships),
    [caseEntities, relationships],
  );

  const queryResult = useMemo(() => {
    if (!query.trim()) return null;
    const match = caseEntities.find((e) => e.name.toLowerCase().includes(query.toLowerCase()));
    if (!match) return { match: null };
    const depth1 = new Set<string>([match.id]);
    relationships.forEach((r) => {
      if (r.sourceId === match.id) depth1.add(r.targetId);
      if (r.targetId === match.id) depth1.add(r.sourceId);
    });
    const depth2 = new Set(depth1);
    relationships.forEach((r) => {
      if (depth1.has(r.sourceId)) depth2.add(r.targetId);
      if (depth1.has(r.targetId)) depth2.add(r.sourceId);
    });
    const subEntities = caseEntities.filter((e) => depth2.has(e.id));
    const subRels = relationships.filter((r) => depth2.has(r.sourceId) && depth2.has(r.targetId));
    return { match, count: depth2.size - 1, subEntities, subRels };
  }, [query, caseEntities, relationships]);

  if (!caseRecord) {
    return (
      <div className="py-20 text-center text-sm text-text-muted">
        Case not found. <Link to="/cases" className="text-cyan-400 underline">Back to cases</Link>
      </div>
    );
  }

  const daysOpen = Math.round((Date.now() - new Date(caseRecord.createdAt).getTime()) / 86400000);

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
    () => (keyPlayersMode ? new Set(centrality.slice(0, 5).map((c) => c.entity.id)) : undefined),
    [keyPlayersMode, centrality],
  );

  const entityTypeCounts = caseEntities.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});
  const visibleEntities = entityTypeFilter === "all" ? caseEntities : caseEntities.filter((e) => e.type === entityTypeFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-xs text-text-muted">{caseRecord.id}</span>
              <Badge variant={caseRecord.status === "active" ? "cyan" : caseRecord.status === "under_review" ? "amber" : "green"}>
                {caseRecord.status.replace("_", " ")}
              </Badge>
              <Badge variant={caseRecord.priority === "critical" ? "red" : caseRecord.priority === "high" ? "orange" : "outline"}>
                {caseRecord.priority} priority
              </Badge>
            </div>
            <h1 className="mt-1.5 text-lg font-semibold text-text">{caseRecord.title}</h1>
            <p className="text-xs text-text-secondary">{caseRecord.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {caseRecord.assignedInvestigators.map((inv) => (
                <div
                  key={inv.badge}
                  title={inv.name}
                  className="flex size-8 items-center justify-center rounded-full border-2 border-bg-elevated bg-panel-hover text-[10px] font-semibold text-cyan-300"
                >
                  {inv.initials}
                </div>
              ))}
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Link to="/evidence"><Button size="sm" variant="outline"><UploadCloud size={13} /> Upload Evidence</Button></Link>
            <Button size="sm" onClick={() => window.print()}><FileText size={13} /> Generate Report</Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-text-muted">
          <span>Created {formatDate(caseRecord.createdAt)}</span>
          <span>Updated {formatDate(caseRecord.updatedAt)}</span>
          <span>{daysOpen} days open</span>
          <span>{caseEntities.length} entities · {relationships.length} relationships · {evidenceDocs.length} evidence items</span>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="graph">Network Graph</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>Case Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-text-secondary">{caseRecord.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { label: "Entities", value: caseEntities.length },
                    { label: "Relationships", value: relationships.length },
                    { label: "Evidence", value: evidenceDocs.length },
                    { label: "Days Open", value: daysOpen },
                  ].map((s) => (
                    <div key={s.label} className="rounded-md border border-border bg-panel-hover/40 p-2.5 text-center">
                      <p className="mono text-lg font-semibold text-text">{s.value}</p>
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Key Entities</CardTitle></CardHeader>
              <CardContent>
                <KeyPlayersPanel rows={centrality} onSelect={setSelectedNodeId} activeId={selectedNodeId} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader><SectionHeader title="Recent Activity" description="Latest logged events for this case" /></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {events.slice(-5).reverse().map((e) => {
                const Icon = EVENT_ICON[e.type];
                return (
                  <div key={e.id} className="flex items-start gap-3 rounded-md border border-border bg-panel-hover/30 p-2.5">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-panel">
                      <Icon size={13} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text">{e.title}</p>
                      <p className="text-[11px] text-text-secondary">{e.description}</p>
                      <p className="mt-1 text-[10px] text-text-muted">{formatDateTime(e.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NETWORK GRAPH */}
        <TabsContent value="graph">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr_300px]">
            <Card className="p-3.5 lg:h-[640px] lg:overflow-y-auto">
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
              />
            </Card>

            <Card className="relative overflow-hidden p-0 lg:h-[640px]">
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
                height={640}
              />
              <GraphLegend />
            </Card>

            <Card className="p-0 lg:h-[640px] lg:overflow-y-auto">
              {findConnectionMode ? (
                <div className="p-4">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-cyan-300">Find Connection</p>
                  <p className="mb-3 text-xs text-text-secondary">Click two nodes on the graph to reveal the shortest path between them.</p>
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
                  <p className="text-xs text-text-muted">Click any node to view its profile, or enable Key Players / Find Connection from the filters panel.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ENTITIES */}
        <TabsContent value="entities">
          <div className="mb-3 flex flex-wrap gap-1.5">
            <FilterPill active={entityTypeFilter === "all"} onClick={() => setEntityTypeFilter("all")} label={`All (${caseEntities.length})`} />
            {(Object.keys(entityTypeCounts) as EntityType[]).map((t) => (
              <FilterPill key={t} active={entityTypeFilter === t} onClick={() => setEntityTypeFilter(t)} label={`${ENTITY_TYPE_LABEL[t]} (${entityTypeCounts[t]})`} />
            ))}
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Connections</TableHead>
                  <TableHead>Cases</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntities.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer">
                    <TableCell>
                      <Link to={`/entities/${e.type}/${e.id}`} className="flex items-center gap-2.5">
                        <EntityIconBadge type={e.type} size={30} />
                        <span className="font-medium text-text">{e.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-text-secondary">{ENTITY_TYPE_LABEL[e.type]}</TableCell>
                    <TableCell><RiskBadge level={e.riskLevel} /></TableCell>
                    <TableCell className="mono">{relationships.filter((r) => r.sourceId === e.id || r.targetId === e.id).length}</TableCell>
                    <TableCell className="text-text-secondary">{e.caseIds.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TIMELINE */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col">
                {events.map((e, i) => {
                  const Icon = EVENT_ICON[e.type];
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      {i !== events.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" />}
                      <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-bg-elevated">
                        <Icon size={14} className="text-cyan-400" />
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-text">{e.title}</p>
                          <Badge variant="outline" className="capitalize">{e.type}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-text-secondary">{e.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-text-muted mono">{formatDateTime(e.timestamp)}</span>
                          {e.entityIds.map((id) => {
                            const ent = getEntity(id);
                            if (!ent) return null;
                            return (
                              <Link key={id} to={`/entities/${ent.type}/${ent.id}`}>
                                <Badge variant="cyan">{ent.name}</Badge>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVIDENCE */}
        <TabsContent value="evidence">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {evidenceDocs.map((doc) => (
              <Card
                key={doc.id}
                className={cn("p-4", doc.extractionStatus === "completed" && "cursor-pointer hover:border-border-strong")}
                onClick={() => doc.extractionStatus === "completed" && setSelectedEvidence(doc)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-panel-hover">
                      <FileText size={14} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-text">{doc.fileName}</p>
                      <p className="text-[10px] text-text-muted">{EVIDENCE_TYPE_LABEL[doc.type]} · {doc.sizeKb} KB</p>
                    </div>
                  </div>
                  <Badge variant={doc.extractionStatus === "completed" ? "green" : doc.extractionStatus === "processing" ? "cyan" : "outline"}>
                    {doc.extractionStatus}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {["Uploaded", "Extracting", "Identifying", "Completed"].map((step, i) => {
                    const thresholds = { pending: 1, processing: 2, completed: 4 } as const;
                    const active = i < thresholds[doc.extractionStatus];
                    return (
                      <div key={step} className="flex flex-1 items-center gap-1">
                        <div className={cn("h-1 flex-1 rounded-full", active ? "bg-cyan-500" : "bg-panel-hover")} />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-text-muted">Uploaded {formatDate(doc.uploadedAt)}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI INSIGHTS */}
        <TabsContent value="ai">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader><SectionHeader title="Suspicious Patterns" description="AI-flagged anomalies specific to this case" /></CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {alerts.map((a) => (
                  <AlertCard
                    key={a.id}
                    alert={{ ...a, reviewed: alertOverrides[a.id] ?? a.reviewed }}
                    showCase={false}
                    onReview={(id) => setAlertOverrides((prev) => ({ ...prev, [id]: true }))}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5"><Sparkles size={14} className="text-cyan-400" /> Ask the Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Who is connected to Rohan Verma?"
                    className="pl-8"
                  />
                </div>
                {queryResult && (
                  <div className="mt-3">
                    {queryResult.match ? (
                      <>
                        <p className="text-xs text-text-secondary">
                          <span className="font-medium text-text">{queryResult.match.name}</span> is connected to{" "}
                          <span className="font-medium text-cyan-300">{queryResult.count}</span> entities within 2 hops.
                        </p>
                        <div className="mt-2 h-52 overflow-hidden rounded-md border border-border">
                          <NetworkGraph
                            entities={queryResult.subEntities ?? []}
                            relationships={queryResult.subRels ?? []}
                            selectedId={queryResult.match.id}
                            layout="force"
                            height={208}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-text-muted">No matching entity found in this case. Try a name like “Aditya Malhotra”.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report">
          <Card className="mx-auto max-w-3xl p-8" id="case-report">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="mono text-[11px] text-text-muted">{caseRecord.id}</p>
                <h2 className="text-lg font-semibold text-text">{caseRecord.title} — Investigation Report</h2>
                <p className="text-xs text-text-muted">Generated {formatDateTime(new Date().toISOString())}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={13} /> Export</Button>
            </div>

            <section className="mt-5">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">Case Summary</h3>
              <p className="text-xs leading-relaxed text-text-secondary">{caseRecord.description}</p>
            </section>

            <section className="mt-5">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">Key Entities</h3>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Entity</TableHead><TableHead>Type</TableHead><TableHead>Connections</TableHead><TableHead>Risk</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {centrality.slice(0, 6).map((row) => (
                    <TableRow key={row.entity.id}>
                      <TableCell className="font-medium">{row.entity.name}</TableCell>
                      <TableCell className="text-text-secondary">{ENTITY_TYPE_LABEL[row.entity.type]}</TableCell>
                      <TableCell className="mono">{row.degree}</TableCell>
                      <TableCell><RiskBadge level={row.entity.riskLevel} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="mt-5">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">Timeline Summary</h3>
              <p className="text-xs text-text-secondary">
                {events.length} logged events between {events[0] && formatDate(events[0].timestamp)} and{" "}
                {events.length > 0 && formatDate(events[events.length - 1].timestamp)}. Most recent: “{events[events.length - 1]?.title}”.
              </p>
            </section>

            <section className="mt-5">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">AI Findings</h3>
              <ul className="flex flex-col gap-1">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-xs text-text-secondary">
                    <ShieldAlert size={12} className="mt-0.5 shrink-0 text-amber" />
                    {a.title} <span className="mono text-text-muted">({a.confidence}% confidence)</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6 border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">Investigator Sign-off</h3>
              {caseRecord.assignedInvestigators.map((inv) => (
                <div key={inv.badge} className="flex items-center gap-2 text-xs text-text-secondary">
                  <CheckCircle2 size={13} className="text-green" />
                  {inv.name} — {inv.badge} <span className="mono text-text-muted">· digitally signed</span>
                </div>
              ))}
            </section>
          </Card>
        </TabsContent>
      </Tabs>

      <AIExtractionModal
        evidence={selectedEvidence}
        open={!!selectedEvidence}
        onOpenChange={(v) => !v && setSelectedEvidence(null)}
        onConfirm={(newRels) => setExtraRelationships((prev) => [...prev, ...newRels])}
      />
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] transition-colors",
        active ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-border text-text-secondary hover:bg-panel-hover",
      )}
    >
      {label}
    </button>
  );
}
