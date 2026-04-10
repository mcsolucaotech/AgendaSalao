import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export default function ThemeSwitcher({ className = '' }) {
  const { theme, accent, setTheme, setAccent } = useTheme();
  const accentOptions = [
    { value: 'blue', label: 'Azul', color: '#2563eb' },
    { value: 'violet', label: 'Violeta', color: '#7c3aed' },
    { value: 'emerald', label: 'Esmeralda', color: '#059669' },
    { value: 'ruby', label: 'Rubi', color: '#e11d48' },
  ];

  return (
    <div
      className={`theme-switcher ${className}`}
      role="group"
      aria-label="Seletor de tema"
    >
      <div className="theme-switcher__row">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`theme-switcher__button ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              title={`Tema ${option.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>
      <div className="theme-switcher__palette" aria-label="Paleta de cores">
        {accentOptions.map((option) => {
          const active = accent === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccent(option.value)}
              className={`theme-swatch ${active ? 'is-active' : ''}`}
              style={{ '--swatch-color': option.color }}
              aria-pressed={active}
              title={`Paleta ${option.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}
