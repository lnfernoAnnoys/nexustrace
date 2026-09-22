import { Link } from "react-router-dom";
import { ArrowUpRight, X, Share2 } from "lucide-react";
import { EntityIconBadge } from "@/components/shared/EntityIcon";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getEntity, getRelationshipsForEntity, ENTITY_TYPE_LABEL, RELATIONSHIP_TYPE_LABEL } from "@/data";
import { formatDate } from "@/lib/utils";
import { tr } from "@/i18n";

export function NodeDetailPanel({
  entityId,
  onClose,
  onFocusEntity,
}: {
  entityId: string;
  onClose: () => void;
  onFocusEntity?: (id: string) => void;
}) {
  const entity = getEntity(entityId);
  if (!entity) return null;
  const allRels = getRelationshipsForEntity(entityId);
  const rels = allRels
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
  const reasons = [...(entity.riskFactors ?? [])].sort((a, b) => b.points - a.points);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="flex items-start gap-3">
          {entity.image ? (
            <img src={entity.image.url} alt={entity.image.caption} referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-lg border border-border-strong object-cover" />
          ) : (
            <EntityIconBadge type={entity.type} size={40} />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{entity.name}</p>
            <p className="text-[11px] text-text-muted">{entity.role ?? ENTITY_TYPE_LABEL[entity.type]}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={entity.riskLevel} />
          <span className="mono text-[11px] text-text-muted">{tr("net.node.score", { n: entity.riskScore })}</span>
        </div>
        {entity.legalStatus && <p className="mt-2 text-[11px] text-amber">{entity.legalStatus}</p>}
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">{entity.summary}</p>

        {reasons.length > 0 && (
          <div className="mt-3 rounded-md border border-border bg-panel-hover/30 p-2.5">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">{tr("ent.whyScore")}</p>
            <ul className="flex flex-col gap-1">
              {reasons.map((f) => (
                <li key={f.label} className="flex items-start justify-between gap-2 text-[11px]" title={f.detail}>
                  <span className="text-text-secondary">{f.label}</span>
                  <span className={f.points < 0 ? "mono shrink-0 text-green" : "mono shrink-0 text-text"}>{f.points > 0 ? `+${f.points}` : f.points}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border bg-panel-hover/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">{tr("common.connections")}</p>
            <p className="mono mt-0.5 text-lg font-semibold text-text">{allRels.length}</p>
          </div>
          <div className="rounded-md border border-border bg-panel-hover/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">{tr("net.node.linkedCases")}</p>
            <p className="mono mt-0.5 text-lg font-semibold text-text">{entity.caseIds.length}</p>
          </div>
        </div>

        {entity.tags && entity.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entity.tags.map((t) => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
          </div>
        )}

        <Separator className="my-4" />

        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">{tr("net.node.topRels")}</p>
        <div className="flex flex-col gap-1.5">
          {rels.map((r) => {
            const otherId = r.sourceId === entityId ? r.targetId : r.sourceId;
            const other = getEntity(otherId);
            if (!other) return null;
            return (
              <button
                key={r.id}
                onClick={() => onFocusEntity?.(other.id)}
                className="flex items-center gap-2 rounded-md border border-border bg-panel-hover/40 px-2.5 py-2 text-left transition-colors hover:border-border-strong hover:bg-panel-hover"
              >
                <EntityIconBadge type={other.type} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-text">{other.name}</p>
                  <p className="text-[10px] text-text-muted">{RELATIONSHIP_TYPE_LABEL[r.type]} · {formatDate(r.startDate)}</p>
                </div>
                <Share2 size={12} className="shrink-0 text-text-muted" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <Link to={`/entities/${entity.type}/${entity.id}`}>
          <Button className="w-full" size="sm">
            {tr("net.node.viewProfile")} <ArrowUpRight size={13} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
