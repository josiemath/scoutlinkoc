import { createContext } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

/** Storage key shared with the inline bootstrap script in index.html. */
export const THEME_STORAGE_KEY = "scoutlink-theme";

export const ThemeContext = createContext<ThemeContextValue | null>(null);
