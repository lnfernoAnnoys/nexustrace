import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LANGUAGES, tr, useI18n, type LangCode } from "@/i18n";
import { cn } from "@/lib/utils";

/** The language card on Settings → Profile. Picking a language changes the whole app straight away. */
export function LanguageCard() {
  const { lang, setLang } = useI18n();
  const [busy, setBusy] = useState<LangCode | null>(null);

  async function choose(code: LangCode) {
    if (busy || code === lang) return;
    setBusy(code);
    try {
      await setLang(code);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Globe size={14} className="text-cyan-400" /> {tr("set.lang.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary">{tr("set.lang.desc")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={tr("set.lang.title")}>
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={active}
                lang={l.code}
                disabled={busy !== null}
                onClick={() => void choose(l.code)}
                className={cn(
                  "relative flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-60",
                  active ? "border-cyan-500/50 bg-cyan-500/10" : "border-border bg-panel-hover/30 hover:border-border-strong",
                )}
              >
                <span className={cn("text-sm font-medium", active ? "text-cyan-300" : "text-text")}>{l.native}</span>
                <span className="text-[10px] text-text-muted">{l.name}</span>
                {active && <Check size={12} className="absolute right-2 top-2 text-cyan-300" />}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] leading-relaxed text-text-muted">{tr("set.lang.note")}</p>
      </CardContent>
    </Card>
  );
}

/** A small dropdown for screens that have no Settings page yet (the sign-in screen). */
export function LanguageSelect({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <label className={cn("inline-flex items-center gap-1.5 text-[11px] text-text-muted", className)}>
      <Globe size={12} />
      <span className="sr-only">{tr("set.lang.title")}</span>
      <select
        value={lang}
        onChange={(e) => void setLang(e.target.value as LangCode)}
        aria-label={tr("set.lang.title")}
        className="rounded border border-border bg-panel px-1.5 py-1 text-[11px] text-text-secondary outline-none focus:border-cyan-500/50"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.native}{l.code === "en" ? "" : ` · ${l.name}`}
          </option>
        ))}
      </select>
    </label>
  );
}
