import { createContext } from 'react';

export const THEME_STORAGE_KEY = 'agenda_salao_theme';
export const ACCENT_STORAGE_KEY = 'agenda_salao_accent';
export const ALLOWED_THEMES = ['light', 'dark', 'system'];
export const ALLOWED_ACCENTS = ['violet', 'blue', 'emerald', 'ruby'];

export const ThemeContext = createContext(null);

export function resolveStoredTheme(value) {
  if (!value) return 'system';
  return ALLOWED_THEMES.includes(value) ? value : 'system';
}

export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveStoredAccent(value) {
  if (!value) return 'blue';
  return ALLOWED_ACCENTS.includes(value) ? value : 'blue';
}
