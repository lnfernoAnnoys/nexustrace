import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tr } from "@/i18n";
import { useTheme } from "@/theme";
import { cn } from "@/lib/utils";

/** The theme card on Settings → Appearance. Picking a theme applies it immediately, no reload needed. */
export function ThemeCard() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{tr("set.appear.theme")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary">{tr("set.appear.themeDesc")}</p>
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={tr("set.appear.theme")}>
          {themes.map((t) => {
            const active = t.code === theme;
            return (
              <button
                key={t.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(t.code)}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  active ? "border-cyan-500/50 bg-cyan-500/10" : "border-border bg-panel-hover/30 hover:border-border-strong",
                )}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong"
                  style={{ backgroundColor: t.swatch.bg }}
                >
                  <span className="size-4 rounded-full" style={{ backgroundColor: t.swatch.accent }} />
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", active ? "text-cyan-300" : "text-text")}>{t.name}</span>
                  <span className="block text-[11px] text-text-muted">{t.description}</span>
                </span>
                {active && <Check size={14} className="absolute right-2.5 top-2.5 text-cyan-300" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
