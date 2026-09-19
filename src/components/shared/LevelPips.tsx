import { Badge } from "@/components/ui/badge";
import { ACCESS_LEVELS, levelTone, type RequestStatus, STATUS_LABEL } from "@/lib/access";
import { cn } from "@/lib/utils";

const FILLED = { blue: "bg-blue", cyan: "bg-cyan", amber: "bg-amber", red: "bg-red" } as const;

/** Eight small bars, filled up to the given level. */
export function LevelPips({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} role="img" aria-label={`Level ${level} of ${ACCESS_LEVELS.length}`}>
      {ACCESS_LEVELS.map((n) => (
        <span
          key={n}
          className={cn("w-1.5 rounded-[1px]", n <= level ? FILLED[levelTone(level)] : "bg-border-strong")}
          style={{ height: 5 + n * 1.5 }}
        />
      ))}
    </span>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <Badge variant={levelTone(level)} className={cn("mono", className)}>
      Level {level}
    </Badge>
  );
}

const STATUS_VARIANT = { pending: "amber", approved: "green", denied: "red", cancelled: "default" } as const;

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
