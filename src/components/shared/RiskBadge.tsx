import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n";

const CONFIG: Record<RiskLevel, { label: "risk.low" | "risk.medium" | "risk.high" | "risk.critical"; className: string; dot: string }> = {
  low: { label: "risk.low", className: "border-green/30 bg-green/10 text-green", dot: "bg-green" },
  medium: { label: "risk.medium", className: "border-amber/30 bg-amber/10 text-amber", dot: "bg-amber" },
  high: { label: "risk.high", className: "border-orange/30 bg-orange/10 text-orange", dot: "bg-orange" },
  critical: { label: "risk.critical", className: "border-red/30 bg-red/10 text-red", dot: "bg-red" },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const c = CONFIG[level];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
        c.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot, level === "critical" && "animate-pulse-slow")} />
      {tr(c.label)}
    </span>
  );
}

export function RiskScoreGauge({ score, level }: { score: number; level: RiskLevel }) {
  const c = CONFIG[level];
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-9 shrink-0">
        <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-panel-hover" />
          <circle
            cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
            className={c.dot.replace("bg-", "text-")}
            style={{ stroke: "currentColor" }}
            strokeDasharray={`${(score / 100) * 97.4} 97.4`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold mono text-text">
          {score}
        </span>
      </div>
      <RiskBadge level={level} />
    </div>
  );
}
