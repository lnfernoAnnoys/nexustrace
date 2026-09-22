import { Trophy } from "lucide-react";
import type { CentralityRow } from "@/data";
import { EntityIconBadge } from "@/components/shared/EntityIcon";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n";

export function KeyPlayersPanel({
  rows,
  activeId,
  onSelect,
}: {
  rows: CentralityRow[];
  activeId?: string | null;
  onSelect: (id: string) => void;
}) {
  const top = rows.slice(0, 8);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-amber">
        <Trophy size={12} /> {tr("net.keyPlayers")}
      </div>
      {top.map((row, i) => (
        <button
          key={row.entity.id}
          onClick={() => onSelect(row.entity.id)}
          className={cn(
            "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
            activeId === row.entity.id ? "border-amber/40 bg-amber/10" : "border-border bg-panel-hover/30 hover:border-border-strong",
          )}
        >
          <span className="mono w-4 text-[10px] text-text-muted">#{i + 1}</span>
          <EntityIconBadge type={row.entity.type} size={24} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-text">{row.entity.name}</p>
            <p className="text-[10px] text-text-muted">
              {tr("net.keyPlayerRow", { degree: row.degree, betweenness: row.betweenness })}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
