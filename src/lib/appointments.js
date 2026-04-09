export function groupAppointmentsByCombo(appointments) {
  const byCombo = new Map();
  const grouped = [];

  for (const appointment of appointments) {
    if (!appointment.combo_id) {
      grouped.push({ type: 'single', id: appointment.id, item: appointment });
      continue;
    }

    if (!byCombo.has(appointment.combo_id)) {
      const comboGroup = { type: 'combo', id: appointment.combo_id, items: [] };
      byCombo.set(appointment.combo_id, comboGroup);
      grouped.push(comboGroup);
    }

    byCombo.get(appointment.combo_id).items.push(appointment);
  }

  return grouped;
}

export function filterAppointmentsBySearch(appointments, searchTerm) {
  const normalizedSearch = String(searchTerm || '').trim().toLowerCase();
  if (!normalizedSearch) return appointments;

  return appointments.filter((appointment) => {
    const professionalName = String(appointment.profissionais?.nome || '').toLowerCase();
    const clientName = String(appointment.cliente_nome || '').toLowerCase();
    const serviceName = String(appointment.servico || '').toLowerCase();

    return (
      clientName.includes(normalizedSearch)
      || serviceName.includes(normalizedSearch)
      || professionalName.includes(normalizedSearch)
    );
  });
}
