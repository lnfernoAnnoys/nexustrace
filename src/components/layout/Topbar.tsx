import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Search, Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "./CommandPalette";
import { alerts, getCase } from "@/data";
import { timeAgo, cn } from "@/lib/utils";
import { tr } from "@/i18n";

const READ_STORAGE_KEY = "nexustrace.readAlertIds";
const MAX_SHOWN = 8;
const AUTO_READ_DELAY_MS = 1200;

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore malformed storage
  }
  return new Set();
}

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);
  const autoReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const params = useParams();
  const activeCase = params.caseId ? getCase(params.caseId) : undefined;

  useEffect(() => {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...readIds]));
  }, [readIds]);

  useEffect(() => () => {
    if (autoReadTimer.current) clearTimeout(autoReadTimer.current);
  }, []);

  const shown = alerts
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, MAX_SHOWN);
  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  function markRead(id: string) {
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }

  function markAllRead() {
    setReadIds(new Set(alerts.map((a) => a.id)));
  }

  function handleNotifOpenChange(open: boolean) {
    setNotifOpen(open);
    if (autoReadTimer.current) {
      clearTimeout(autoReadTimer.current);
      autoReadTimer.current = null;
    }
    if (open) {
      // give the investigator a beat to actually see the "new" state before
      // it clears, rather than wiping the badge the instant the panel opens
      autoReadTimer.current = setTimeout(markAllRead, AUTO_READ_DELAY_MS);
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg-elevated/80 px-4 backdrop-blur">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-panel px-3 text-xs text-text-muted transition-colors hover:border-border-strong hover:text-text-secondary"
        >
          <Search size={13} />
          <span className="flex-1 text-left">{tr("top.search")}</span>
          <kbd className="mono rounded border border-border-strong bg-panel-hover px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        {activeCase && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="text-text-muted">{tr("top.case")}</span>
            <span className="mono text-cyan-300">{activeCase.id}</span>
            <span className="max-w-[220px] truncate text-text">{activeCase.title}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-[11px] text-text-muted sm:flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-green" />
            </span>
            {tr("top.live")}
          </div>

          <Popover open={notifOpen} onOpenChange={handleNotifOpenChange}>
            <PopoverTrigger asChild>
              <button className="relative flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-panel-hover hover:text-text">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red text-[9px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <span className="text-xs font-semibold text-text">{tr("top.alerts")}</span>
                <button
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1 text-[11px] text-cyan-300 transition-colors hover:text-cyan-200 disabled:pointer-events-none disabled:text-text-muted"
                >
                  <CheckCheck size={12} /> {tr("top.markAllRead")}
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {shown.map((a) => {
                  const unread = !readIds.has(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => markRead(a.id)}
                      className={cn(
                        "flex w-full items-start gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-panel-hover",
                        unread && "bg-cyan-500/[0.04]",
                      )}
                    >
                      <span
                        className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", unread ? "bg-cyan-400" : "bg-transparent")}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={a.severity === "critical" ? "red" : a.severity === "high" ? "orange" : "amber"}>
                            {tr(`prio.${a.severity}`)}
                          </Badge>
                          <span className="text-[10px] text-text-muted">{timeAgo(a.timestamp)}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-text">{a.title}</p>
                      </div>
                    </button>
                  );
                })}
                {shown.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-text-muted">{tr("top.noAlerts")}</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
