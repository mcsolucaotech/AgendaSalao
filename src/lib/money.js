/**
 * Formata valor monetário em BRL para exibição.
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function formatBRL(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}
