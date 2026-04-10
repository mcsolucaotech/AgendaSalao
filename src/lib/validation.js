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
  const raw = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/[R$\u00A0]/g, '')
    .replace(/[^\d,.-]/g, '');

  let normalized = raw;
  if (raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = raw.replace(/,/g, '');
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function formatCurrencyMask(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number.parseInt(digits, 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyFromNumber(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
