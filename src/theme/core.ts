// Theme switching with no React in it, so it can be applied before the first paint.
export type ThemeCode = "dark-cyan" | "dark-amber" | "light-blue" | "light-warm";

export interface ThemeInfo {
  code: ThemeCode;
  name: string;
  description: string;
  dark: boolean;
  /** Swatch colours for the picker: page background and the accent, in that theme's own palette. */
  swatch: { bg: string; panel: string; accent: string };
}

export const THEMES: ThemeInfo[] = [
  {
    code: "dark-cyan",
    name: "Cyan Ops",
    description: "The default dark theme.",
    dark: true,
    swatch: { bg: "#090c12", panel: "#121826", accent: "#22d3ee" },
  },
  {
    code: "dark-amber",
    name: "Amber Watch",
    description: "Dark, with a warm amber accent.",
    dark: true,
    swatch: { bg: "#0f0d0a", panel: "#1c1712", accent: "#fbbf24" },
  },
  {
    code: "light-blue",
    name: "Daylight Blue",
    description: "Light, with a cool blue accent.",
    dark: false,
    swatch: { bg: "#f3f5fa", panel: "#ffffff", accent: "#2563eb" },
  },
  {
    code: "light-warm",
    name: "Warm Paper",
    description: "Light and warm, with a deep teal accent.",
    dark: false,
    swatch: { bg: "#faf6ee", panel: "#fffdf8", accent: "#0f766e" },
  },
];

const STORAGE_KEY = "nexustrace.theme";
export const DEFAULT_THEME: ThemeCode = "dark-cyan";

export const isThemeCode = (v: unknown): v is ThemeCode => THEMES.some((t) => t.code === v);

export function initialTheme(): ThemeCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isThemeCode(saved)) return saved;
  } catch {
    // storage can be blocked; fall through
  }
  return DEFAULT_THEME;
}

/** Sets the `data-theme` attribute the CSS in index.css keys off. Safe to call before React mounts. */
export function applyTheme(theme: ThemeCode): void {
  if (typeof document === "undefined") return;
  // the default theme needs no attribute at all (it's the bare :root styling), so clearing it here
  // keeps behaviour identical to before theming existed for anyone who never picks a theme
  if (theme === DEFAULT_THEME) document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

export function rememberTheme(theme: ThemeCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // not being able to remember it is not worth an error
  }
}
