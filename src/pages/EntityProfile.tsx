import { useMemo, useState, type ReactNode } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, Phone, Landmark, Eye, Video, Siren, FileText, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskScoreGauge } from "@/components/shared/RiskBadge";
import { EntityIconBadge, EntityIcon } from "@/components/shared/EntityIcon";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import {
  getEntity,
  getRelationshipsForEntity,
  getEventsForEntity,
  getCase,
  connectedEntityIds,
  ENTITY_TYPE_LABEL,
  RELATIONSHIP_TYPE_LABEL,
  allEntities,
  relationships as allRelationships,
} from "@/data";
import type { EventType } from "@/types";
import { cn, formatDate, formatDateTime, formatINR } from "@/lib/utils";

const EVENT_ICON: Record<EventType, typeof Phone> = {
  call: Phone, transaction: Landmark, sighting: Eye, meeting: UsersIcon, arrest: Siren, filing: FileText, surveillance: Video,
};

function generateAINote(name: string, degree: number, riskScore: number): string {
  if (riskScore >= 85) {
    return `${name} shows a statistically unusual concentration of high-strength connections and sits at a structural chokepoint in the network — recommend priority surveillance.`;
  }
  if (degree >= 6) {
    return `${name}'s connection count (${degree}) is well above the network average, suggesting a coordinating or brokering role rather than a peripheral one.`;
  }
  if (riskScore >= 60) {
    return `${name} shows moderate-risk behavioural indicators. No structural anomalies detected yet — recommend continued monitoring.`;
  }
  return `${name} currently shows low structural significance in the network. No anomalies detected in available data.`;
}

export default function EntityProfile() {
  const { type, id = "" } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const entity = getEntity(id);
  const [subSelected, setSubSelected] = useState<string | null>(id);

  const rels = useMemo(() => getRelationshipsForEntity(id).sort((a, b) => b.strength - a.strength), [id]);
  const events = useMemo(() => getEventsForEntity(id), [id]);

  const { subEntities, subRels } = useMemo(() => {
    const hop1 = connectedEntityIds(id);
    const idSet = new Set([id, ...hop1]);
    return {
      subEntities: allEntities.filter((e) => idSet.has(e.id)),
      subRels: allRelationships.filter((r) => idSet.has(r.sourceId) && idSet.has(r.targetId)),
    };
  }, [id]);

  if (!entity || entity.type !== type) {
    return (
      <div className="py-20 text-center text-sm text-text-muted">
        Entity not found. <Link to="/cases" className="text-cyan-400 underline">Back to cases</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <EntityIconBadge type={entity.type} size={52} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mono text-lg font-semibold text-text">{entity.name}</h1>
                <Badge variant="outline">{ENTITY_TYPE_LABEL[entity.type]}</Badge>
              </div>
              <p className="mt-1 max-w-xl text-xs text-text-secondary">{entity.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entity.caseIds.map((cid) => {
                  const c = getCase(cid);
                  return c ? (
                    <Link key={cid} to={`/cases/${cid}`}>
                      <Badge variant="cyan" className="mono">{c.id}</Badge>
                    </Link>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <RiskScoreGauge score={entity.riskScore} level={entity.riskLevel} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-xs">
            <EntityDetails entity={entity} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Immediate Network</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate(`/network?focus=${entity.id}`)}>
                Open in Network Explorer <ArrowUpRight size={13} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-72 p-0">
            <NetworkGraph
              entities={subEntities}
              relationships={subRels}
              selectedId={subSelected}
              onSelectNode={setSubSelected}
              layout="force"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Relationships ({rels.length})</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Connected Entity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Active Period</TableHead>
              <TableHead>Evidence Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rels.map((r) => {
              const otherId = r.sourceId === id ? r.targetId : r.sourceId;
              const other = getEntity(otherId);
              if (!other) return null;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/entities/${other.type}/${other.id}`} className="flex items-center gap-2">
                      <EntityIcon type={other.type} size={14} />
                      <span className="text-text">{other.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="outline">{RELATIONSHIP_TYPE_LABEL[r.type]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel-hover">
                        <div className="h-full bg-cyan-500" style={{ width: `${r.strength * 10}%` }} />
                      </div>
                      <span className="mono text-[10px] text-text-muted">{r.strength}/10</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">{formatDate(r.startDate)} – {formatDate(r.endDate)}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-text-secondary">{r.evidenceSource}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {events.length === 0 && <p className="text-xs text-text-muted">No logged events for this entity.</p>}
            {events.map((e) => {
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

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Sparkles size={14} className="text-cyan-400" /> AI Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="rounded-md border border-cyan-500/20 bg-cyan-500/[0.06] p-3 text-xs leading-relaxed text-text-secondary">
              {generateAINote(entity.name, rels.length, entity.riskScore)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EntityDetails({ entity }: { entity: ReturnType<typeof getEntity> }) {
  if (!entity) return null;
  const row = (label: string, value: ReactNode) => (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className={cn("text-right text-text", typeof value === "string" && "mono")}>{value}</span>
    </div>
  );

  switch (entity.type) {
    case "person":
      return (
        <>
          {row("Aliases", entity.aliases.join(", ") || "—")}
          {row("Date of Birth", formatDate(entity.dob))}
          {row("Nationality", entity.nationality)}
          {row("Occupation", entity.occupation)}
          {row("Address", entity.address)}
          <div className="pt-2">
            <p className="mb-1 text-text-muted">Criminal History</p>
            {entity.criminalHistory.length === 0 ? (
              <p className="text-text-secondary">No prior record on file.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-4 text-text-secondary">
                {entity.criminalHistory.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
          </div>
        </>
      );
    case "phone":
      return (
        <>
          {row("Number", entity.number)}
          {row("Carrier", entity.carrier)}
          {row("First Seen", formatDate(entity.firstSeen))}
          {row("Last Seen", formatDate(entity.lastSeen))}
          {entity.imei && row("IMEI", entity.imei)}
        </>
      );
    case "vehicle":
      return (
        <>
          {row("Plate", entity.plate)}
          {row("Make / Model", `${entity.make} ${entity.model}`)}
          {row("Color", entity.color)}
        </>
      );
    case "organization":
      return (
        <>
          {row("Org. Type", entity.orgType)}
          {row("Registered Address", entity.registeredAddress)}
          {row("Incorporated On", formatDate(entity.incorporatedOn))}
        </>
      );
    case "location":
      return (
        <>
          {row("Address", entity.address)}
          {row("Location Type", entity.locationType)}
          {row("Coordinates", `${entity.coordinates.lat.toFixed(4)}, ${entity.coordinates.lng.toFixed(4)}`)}
        </>
      );
    case "financial_account":
      return (
        <>
          {row("Account Number", entity.accountNumber)}
          {row("Bank", entity.bank)}
          {row("Account Type", entity.accountType)}
          {row("Estimated Balance", formatINR(entity.balanceEstimate))}
        </>
      );
    default:
      return null;
  }
}
