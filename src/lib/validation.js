export const MAX_NAME_LENGTH = 80;
export const MAX_NOTES_LENGTH = 300;

export function sanitizeText(value, maxLength = 120) {
  if (value == null) return '';
  const safe = String(value)
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');
  return safe
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizePhone(value) {
  if (value == null) return '';
  return String(value).replace(/\D/g, '').slice(0, 11);
}

export function normalizeEmail(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

export function parseCurrencyInput(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function clampPercentage(value) {
  if (value === '' || value == null) return null;
  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 100) return null;
  return Math.round(parsed * 10) / 10;
}

export function isValidIsoDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime());
}
