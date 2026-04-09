import { startOfDay, endOfDay, startOfToday } from 'date-fns';
import { supabase } from '../lib/supabase';

const APPOINTMENTS_SELECT = `
  id,
  data_hora,
  cliente_nome,
  cliente_telefone,
  servico,
  observacoes,
  status,
  profissional_id,
  valor_cobrado,
  combo_id,
  profissionais ( nome )
`;

export async function fetchProfessionalsBasic() {
  return supabase
    .from('profissionais')
    .select('id, nome')
    .order('nome');
}

export async function fetchAppointmentsForManagement({ filter = 'upcoming', professionalId = '' } = {}) {
  let query = supabase
    .from('agendamentos')
    .select(APPOINTMENTS_SELECT)
    .order('data_hora', { ascending: true });

  if (filter === 'upcoming') {
    query = query.gte('data_hora', startOfToday().toISOString());
  }

  if (professionalId) {
    query = query.eq('profissional_id', professionalId);
  }

  return query;
}

export async function fetchAppointmentsByDay({ selectedDate, professionalId = null }) {
  let query = supabase
    .from('agendamentos')
    .select('*, profissionais(nome)')
    .gte('data_hora', startOfDay(selectedDate).toISOString())
    .lte('data_hora', endOfDay(selectedDate).toISOString())
    .order('data_hora', { ascending: true });

  if (professionalId) {
    query = query.eq('profissional_id', professionalId);
  }

  return query;
}

export async function deleteAppointmentById(appointmentId) {
  return supabase
    .from('agendamentos')
    .delete()
    .eq('id', appointmentId);
}

export async function deleteComboById(comboId) {
  return supabase
    .from('agendamentos')
    .delete()
    .eq('combo_id', comboId);
}
