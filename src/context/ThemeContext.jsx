import React, { useEffect, useMemo, useState } from 'react';
import {
  ACCENT_STORAGE_KEY,
  ALLOWED_ACCENTS,
  ALLOWED_THEMES,
  getSystemTheme,
  resolveStoredAccent,
  resolveStoredTheme,
  THEME_STORAGE_KEY,
  ThemeContext,
} from './themeContextInternal';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return resolveStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const [accent, setAccent] = useState(() => {
    if (typeof window === 'undefined') return 'blue';
    return resolveStoredAccent(window.localStorage.getItem(ACCENT_STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light');

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-theme-preference', theme);
    root.setAttribute('data-accent', accent);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, theme, accent]);

  const setThemePreference = (nextTheme) => {
    const safeTheme = resolveStoredTheme(nextTheme);
    setTheme(safeTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
    }
  };

  const setAccentPreference = (nextAccent) => {
    const safeAccent = resolveStoredAccent(nextAccent);
    setAccent(safeAccent);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, safeAccent);
    }
  };

  const value = useMemo(() => ({
    theme,
    accent,
    resolvedTheme,
    setTheme: setThemePreference,
    setAccent: setAccentPreference,
    themes: ALLOWED_THEMES,
    accents: ALLOWED_ACCENTS,
  }), [theme, accent, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
