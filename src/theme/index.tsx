import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyTheme, initialTheme, rememberTheme, THEMES, type ThemeCode } from "./core";

export { THEMES, type ThemeCode, type ThemeInfo } from "./core";

interface ThemeState {
  theme: ThemeCode;
  setTheme: (t: ThemeCode) => void;
}

const Ctx = createContext<ThemeState | null>(null);

/** Applies the saved theme (or the default) before the first paint, and lets the rest of the app change it. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeCode>(() => {
    const t = initialTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(next: ThemeCode) {
    rememberTheme(next);
    setThemeState(next);
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeState & { themes: typeof THEMES } {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return { ...ctx, themes: THEMES };
}
