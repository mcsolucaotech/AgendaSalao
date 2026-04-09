// ── AppLogo ──────────────────────────────────────────────────────────────────
// Altere APP_NAME em src/constants.js para mudar o nome em toda a aplicação.
// O ponto (.) separa o prefixo do sufixo colorido. Ex: "Agenda.Ouro"
// ─────────────────────────────────────────────────────────────────────────────
import { APP_TITLE_PREFIX, APP_TITLE_SUFFIX } from '../constants';

export default function AppLogo({ className = 'text-4xl' }) {
  return (
    <span className={`font-black text-gray-900 font-display leading-none tracking-tight ${className}`}>
      {APP_TITLE_PREFIX}
      <span className="text-lavender-600">.</span>
      {APP_TITLE_SUFFIX}
    </span>
  );
}
