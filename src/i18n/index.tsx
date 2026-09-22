import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { bumpData } from "@/data/store";
import { refreshAlerts } from "@/data";
import { LANGUAGES, initialLanguage, loadLanguage, rememberLanguage, type LangCode } from "./core";

export { LANGUAGES, tr, trn, labelMap, currentLanguage, currentLocale, type LangCode, type LanguageInfo } from "./core";

interface I18nState {
  lang: LangCode;
  setLang: (l: LangCode) => Promise<void>;
}

const Ctx = createContext<I18nState | null>(null);

/**
 * Holds the chosen language. Changing it loads the new dictionary and then re-creates the screen underneath, so that
 * every label, date and chart legend is drawn again in the new language (the case data itself is not touched).
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);

  async function apply(next: LangCode) {
    await loadLanguage(next);
    setLangState(next);
    setGeneration((g) => g + 1);
    setReady(true);
  }

  useEffect(() => {
    void apply(initialLanguage());
  }, []);

  async function setLang(next: LangCode) {
    if (next === lang) return;
    rememberLanguage(next);
    await apply(next);
    // findings are worked out as text from the graph, so they are worked out again in the new language
    refreshAlerts();
    bumpData();
  }

  if (!ready) return null;
  return (
    <Ctx.Provider value={{ lang, setLang }}>
      <Fragment key={generation}>{children}</Fragment>
    </Ctx.Provider>
  );
}

export function useI18n(): I18nState & { languages: typeof LANGUAGES } {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return { ...ctx, languages: LANGUAGES };
}
