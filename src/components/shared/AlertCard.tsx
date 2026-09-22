import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import type { AIAlert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { getCase } from "@/data";
import { tr } from "@/i18n";

const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert, className: "border-red/30 bg-red/[0.06]", badge: "red" as const, glow: "glow-red" },
  high: { icon: AlertTriangle, className: "border-orange/25 bg-orange/[0.05]", badge: "orange" as const, glow: "" },
  medium: { icon: Info, className: "border-amber/20 bg-amber/[0.04]", badge: "amber" as const, glow: "" },
};

export function AlertCard({
  alert,
  onReview,
  showCase = true,
}: {
  alert: AIAlert;
  onReview?: (id: string) => void;
  showCase?: boolean;
}) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const Icon = cfg.icon;
  const relatedCase = getCase(alert.caseId);

  return (
    <div className={cn("rounded-lg border p-3.5 transition-shadow", cfg.className, alert.severity === "critical" && !alert.reviewed && cfg.glow)}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border", cfg.className)}>
          <Icon size={14} className={`text-${alert.severity === "critical" ? "red" : alert.severity === "high" ? "orange" : "amber"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={cfg.badge}>{tr(`prio.${alert.severity}`).toUpperCase()}</Badge>
            <Badge variant="outline">{tr(`alertcat.${alert.category}`)}</Badge>
            {showCase && relatedCase && <Badge variant="outline" className="mono">{relatedCase.id}</Badge>}
            {alert.reviewed && <Badge variant="green">{tr("alert.reviewedBadge")}</Badge>}
          </div>
          <p className="mt-1.5 text-sm font-medium text-text">{alert.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{alert.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span>{tr("common.confidence")}: <span className="mono text-text-secondary">{alert.confidence}%</span></span>
              <span>{timeAgo(alert.timestamp)}</span>
            </div>
            {onReview && !alert.reviewed && (
              <Button size="sm" variant="outline" onClick={() => onReview(alert.id)}>
                {tr("common.review")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
