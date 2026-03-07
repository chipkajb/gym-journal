"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { THEME_COOKIE_NAME, setThemeCookie, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const match = document.cookie.match(new RegExp(`${THEME_COOKIE_NAME}=(light|dark)`));
  if (match) return match[1] as Theme;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const setTheme = useCallback((next: Theme) => {
    setThemeCookie(next);
    applyTheme(next);
    setThemeState(next);
    setResolved(next);
  }, []);

  useEffect(() => {
    const next = readTheme();
    applyTheme(next);
    setThemeState(next);
    setResolved(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
