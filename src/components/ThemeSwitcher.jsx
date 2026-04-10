import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Monitor, Palette, ChevronDown } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export default function ThemeSwitcher({ className = '' }) {
  const { theme, accent, setTheme, setAccent } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const accentOptions = [
    { value: 'blue', label: 'Azul', color: '#2563eb' },
    { value: 'violet', label: 'Violeta', color: '#7c3aed' },
    { value: 'emerald', label: 'Esmeralda', color: '#059669' },
    { value: 'ruby', label: 'Rubi', color: '#e11d48' },
    { value: 'gray', label: 'Cinza', color: '#4b5563' },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`theme-switcher ${isOpen ? 'is-open' : ''} ${className}`}
      aria-label="Seletor de tema"
    >
      <button
        type="button"
        className={`theme-switcher__trigger ${isOpen ? 'is-active' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        title="Aparência"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Aparência</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="theme-switcher__panel" role="group" aria-label="Escolher tema e paleta">
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
                  <span>{option.label}</span>
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
      )}
    </div>
  );
}
