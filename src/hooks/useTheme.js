import { useContext } from 'react';
import { ThemeContext } from '../context/themeContextInternal';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }
  return ctx;
}
