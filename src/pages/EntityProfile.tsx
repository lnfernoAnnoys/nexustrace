import { useMemo, useState, type ReactNode } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, ExternalLink, Info, Phone, Landmark, Eye, Video, Siren, FileText, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskScoreGauge } from "@/components/shared/RiskBadge";
import { EntityIconBadge, EntityIcon } from "@/components/shared/EntityIcon";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { SocialCard } from "@/components/social/SocialCard";
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
import type { Entity, EventType } from "@/types";
import { cn, formatDate, formatDateTime, formatINR } from "@/lib/utils";
import { tr } from "@/i18n";

const EVENT_ICON: Record<EventType, typeof Phone> = {
  call: Phone, transaction: Landmark, sighting: Eye, meeting: UsersIcon, arrest: Siren, filing: FileText, surveillance: Video,
};

function generateAINote(entity: Entity, degree: number): string {
  const cases = entity.caseIds.length;
  const structure = cases > 1 ? tr("ent.note.structureMulti", { name: entity.name, n: degree, c: cases }) : tr("ent.note.structure", { name: entity.name, n: degree });
  if (/acquitted/i.test(entity.legalStatus ?? "")) {
    return tr("ent.note.acquitted", { structure, status: entity.legalStatus ?? "" });
  }
  const top = [...(entity.riskFactors ?? [])].filter((f) => f.points > 0).sort((a, b) => b.points - a.points).slice(0, 2);
  if (top.length === 0) return tr("ent.note.noFactors", { structure });
  return tr("ent.note.drivers", { structure, factors: top.map((f) => f.label.toLowerCase()).join(` ${tr("ent.note.and")} `) });
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
        {tr("ent.notFound")} <Link to="/cases" className="text-cyan-400 underline">{tr("cw.backToCases")}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {entity.image ? (
              <a href={entity.image.pageUrl} target="_blank" rel="noreferrer" title={`${entity.image.caption} · ${entity.image.credit} · ${entity.image.license}`}>
                <img src={entity.image.url} alt={entity.image.caption} referrerPolicy="no-referrer" className="size-16 rounded-lg border border-border-strong object-cover" />
              </a>
            ) : (
              <EntityIconBadge type={entity.type} size={52} />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-text">{entity.name}</h1>
                <Badge variant="outline">{ENTITY_TYPE_LABEL[entity.type]}</Badge>
              </div>
              {entity.role && <p className="mt-0.5 text-xs text-text-secondary">{entity.role}</p>}
              {entity.legalStatus && (
                <p className="mt-1.5">
                  <Badge variant={/acquitted/i.test(entity.legalStatus) ? "green" : /convicted|fugitive/i.test(entity.legalStatus) ? "red" : "amber"}>
                    {tr("ent.status", { status: entity.legalStatus })}
                  </Badge>
                </p>
              )}
              <p className="mt-1.5 max-w-xl text-xs text-text-secondary">{entity.summary}</p>
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
          <CardHeader><CardTitle>{tr("ent.details")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-xs">
            <EntityDetails entity={entity} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{tr("ent.immNet")}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate(`/network?focus=${entity.id}`)}>
                {tr("ent.openNet")} <ArrowUpRight size={13} />
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

      {(entity.riskFactors?.length || entity.description !== entity.summary || entity.sources?.length) && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {entity.riskFactors && entity.riskFactors.length > 0 && (
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5"><Info size={14} className="text-cyan-400" /> {tr("ent.whyScore")}</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <tbody>
                    {entity.riskFactors.map((f) => (
                      <tr key={f.label} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 align-top">
                          <p className="font-medium text-text">{f.label}</p>
                          <p className="text-[11px] text-text-muted">{f.detail}</p>
                        </td>
                        <td className={cn("mono w-14 py-2 text-right align-top font-semibold", f.points < 0 ? "text-green" : "text-amber")}>
                          {f.points > 0 ? `+${f.points}` : f.points}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="pt-2 text-text-secondary">{tr("ent.total")}</td>
                      <td className="mono pt-2 text-right text-sm font-semibold text-text">{entity.riskScore}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-3 rounded-md border border-border bg-panel-hover/30 p-2.5 text-[11px] leading-relaxed text-text-muted">
                  {tr("ent.scoreNote")}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-4">
            {entity.description && entity.description !== entity.summary && (
              <Card>
                <CardHeader><CardTitle>{tr("ent.about")}</CardTitle></CardHeader>
                <CardContent><p className="text-xs leading-relaxed text-text-secondary">{entity.description}</p></CardContent>
              </Card>
            )}
            {entity.sources && entity.sources.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{tr("ent.readMore")}</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-1.5">
                  {entity.sources.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="group flex items-start gap-2 rounded-md border border-border bg-panel-hover/30 px-2.5 py-2 hover:border-border-strong">
                      <ExternalLink size={12} className="mt-0.5 shrink-0 text-text-muted group-hover:text-cyan-300" />
                      <span className="min-w-0">
                        <span className="block text-xs text-text group-hover:text-cyan-300">{s.title}</span>
                        <span className="text-[10px] text-text-muted">{s.publisher}</span>
                      </span>
                    </a>
                  ))}
                  {entity.image && <p className="mt-1 text-[10px] text-text-muted">{tr("ent.photo", { credit: entity.image.credit, license: entity.image.license })}</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {(entity.type === "person" || entity.type === "organization") && <SocialCard entity={entity} />}

      <Card>
        <CardHeader><CardTitle>{tr("ent.relationships", { n: rels.length })}</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr("ent.col.connected")}</TableHead>
              <TableHead>{tr("common.type")}</TableHead>
              <TableHead>{tr("ent.col.strength")}</TableHead>
              <TableHead>{tr("ent.col.period")}</TableHead>
              <TableHead>{tr("ent.col.evidence")}</TableHead>
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
          <CardHeader><CardTitle>{tr("cw.tab.timeline")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {events.length === 0 && <p className="text-xs text-text-muted">{tr("ent.noEvents")}</p>}
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
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Sparkles size={14} className="text-cyan-400" /> {tr("ent.aiNotes")}</CardTitle></CardHeader>
          <CardContent>
            <p className="rounded-md border border-cyan-500/20 bg-cyan-500/[0.06] p-3 text-xs leading-relaxed text-text-secondary">
              {generateAINote(entity, rels.length)}
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
          {row(tr("ent.d.aliases"), entity.aliases.join(", ") || "—")}
          {row(tr("ent.d.born"), entity.dob || "—")}
          {row(tr("ent.d.nationality"), entity.nationality || "—")}
          {row(tr("ent.d.occupation"), entity.occupation || "—")}
          {row(tr("ent.d.based"), entity.address)}
          <div className="pt-2">
            <p className="mb-1 text-text-muted">{tr("ent.d.legal")}</p>
            {entity.criminalHistory.length === 0 ? (
              <p className="text-text-secondary">{tr("ent.d.noneListed")}</p>
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
          {row(tr("ent.d.number"), entity.number)}
          {row(tr("ent.d.carrier"), entity.carrier)}
          {row(tr("ent.d.firstSeen"), formatDate(entity.firstSeen))}
          {row(tr("ent.d.lastSeen"), formatDate(entity.lastSeen))}
          {entity.imei && row("IMEI", entity.imei)}
        </>
      );
    case "vehicle":
      return (
        <>
          {row(tr("ent.d.plate"), entity.plate)}
          {row(tr("ent.d.makeModel"), `${entity.make} ${entity.model}`)}
          {row(tr("ent.d.color"), entity.color)}
        </>
      );
    case "organization":
      return (
        <>
          {row(tr("ent.d.orgType"), entity.orgType)}
          {row(tr("ent.d.regAddress"), entity.registeredAddress || "—")}
          {row(tr("ent.d.incorporated"), entity.incorporatedOn ? formatDate(entity.incorporatedOn) : "—")}
        </>
      );
    case "location":
      return (
        <>
          {row(tr("ent.d.address"), entity.address)}
          {row(tr("ent.d.locType"), entity.locationType)}
          {row(tr("ent.d.coordinates"), `${entity.coordinates.lat.toFixed(4)}, ${entity.coordinates.lng.toFixed(4)}`)}
        </>
      );
    case "financial_account":
      return (
        <>
          {row(tr("ent.d.accountNumber"), entity.accountNumber)}
          {row(tr("ent.d.bank"), entity.bank)}
          {row(tr("ent.d.accountType"), entity.accountType)}
          {row(tr("ent.d.amount"), formatINR(entity.balanceEstimate))}
        </>
      );
    default:
      return null;
  }
}
