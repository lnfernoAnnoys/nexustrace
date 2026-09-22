// Translation core with no React in it, so that plain functions (date formatting, alert text) can use it too.
// English (en.ts) is the source of truth and is always loaded; the other languages are loaded on demand.
import { en, type Key, type PluralKey } from "./en";

export type LangCode = "en" | "hi" | "mr" | "bn" | "ta" | "te";

export interface LanguageInfo {
  code: LangCode;
  /** Name in English. */
  name: string;
  /** Name in its own script. */
  native: string;
  /** BCP 47 locale for dates and numbers. */
  locale: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", native: "English", locale: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", locale: "hi-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", locale: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", locale: "bn-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", locale: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", locale: "te-IN" },
];

type Dict = Record<string, string | undefined>;

const loaders: Record<Exclude<LangCode, "en">, () => Promise<{ default: Dict }>> = {
  hi: () => import("./locales/hi"),
  mr: () => import("./locales/mr"),
  bn: () => import("./locales/bn"),
  ta: () => import("./locales/ta"),
  te: () => import("./locales/te"),
};

const STORAGE_KEY = "nexustrace.language";

let dict: Dict = en;
let code: LangCode = "en";

export const isLangCode = (v: unknown): v is LangCode => LANGUAGES.some((l) => l.code === v);

/** The language chosen earlier on this device, or the browser's language if it is one we have, or English. */
export function initialLanguage(): LangCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLangCode(saved)) return saved;
  } catch {
    // storage can be blocked; fall through
  }
  const browser = (typeof navigator !== "undefined" ? navigator.language : "en").slice(0, 2).toLowerCase();
  return isLangCode(browser) ? browser : "en";
}

export function rememberLanguage(lang: LangCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not being able to remember it is not worth an error
  }
}

/** Loads a language and makes it the current one. Resolves once every later call to tr() uses it. */
export async function loadLanguage(lang: LangCode): Promise<void> {
  if (lang === "en") dict = en;
  else dict = (await loaders[lang]()).default;
  code = lang;
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export const currentLanguage = () => code;

/** Locale for Intl. Western digits are kept in every language, as on Indian government sites. */
export function currentLocale(): string {
  return `${LANGUAGES.find((l) => l.code === code)?.locale ?? "en-IN"}-u-nu-latn`;
}

const fill = (s: string, params?: Record<string, string | number>) =>
  params ? s.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`)) : s;

/** Translate a key. A missing translation shows the English text, never a blank or the key. */
export function tr(key: Key, params?: Record<string, string | number>): string {
  return fill(dict[key] ?? en[key] ?? key, params);
}

/** An object that looks like { person: "Person", … } but reads each label in the current language when it is used. */
export function labelMap<K extends string>(prefix: string): Record<K, string> {
  return new Proxy({} as Record<K, string>, {
    get: (_t, k) => (typeof k === "string" ? tr(`${prefix}.${k}` as Key) : undefined),
  });
}

/** Like tr(), for counts: English has "x.one" ("1 finding") next to "x" ("{n} findings"); other languages use one form. */
export function trn(key: PluralKey, n: number, params?: Record<string, string | number>): string {
  const oneKey = `${key}.one` as Key;
  const s = n === 1 ? (dict[oneKey] ?? (code === "en" ? en[oneKey] : undefined)) : undefined;
  return fill(s ?? dict[key] ?? en[key], { n, ...params });
}
