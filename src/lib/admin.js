import { MAX_NAME_LENGTH, sanitizeText } from './validation';

export function generateProfessionalEmail(name) {
  const username = sanitizeText(name, MAX_NAME_LENGTH)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return username ? `${username}@salao.com` : '';
}

export function calculateRevenueSummary(revenueData) {
  const total = revenueData.reduce((sum, item) => sum + (Number(item.valor_cobrado) || 0), 0);
  const count = revenueData.length;
  const average = count > 0 ? total / count : 0;

  return { total, count, average };
}

export function calculateRevenueByProfessional(professionals, revenueData, selectedProfessional) {
  return professionals
    .map((professional) => {
      const professionalItems = revenueData.filter((item) => item.profissional_id === professional.id);
      const total = professionalItems.reduce((sum, item) => sum + (Number(item.valor_cobrado) || 0), 0);
      return { ...professional, total, count: professionalItems.length };
    })
    .filter((professional) => (selectedProfessional ? professional.id === selectedProfessional : professional.count > 0))
    .sort((a, b) => b.total - a.total);
}
