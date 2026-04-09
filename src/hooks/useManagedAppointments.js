import { useCallback, useEffect, useState } from 'react';
import {
  deleteAppointmentById,
  deleteComboById,
  fetchAppointmentsForManagement,
  fetchProfessionalsBasic,
} from '../services/appointmentsService';

export function useManagedAppointments({ filter, professionalIdFilter }) {
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfessionals = async () => {
      const { data, error: err } = await fetchProfessionalsBasic();
      if (!err && data) setProfessionals(data);
    };

    loadProfessionals();
  }, []);

  const refreshAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await fetchAppointmentsForManagement({
      filter,
      professionalId: professionalIdFilter,
    });

    if (err) {
      setError('Não foi possível carregar os agendamentos.');
      setAppointments([]);
      setLoading(false);
      return;
    }

    setAppointments(data || []);
    setLoading(false);
  }, [filter, professionalIdFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- atualização acontece em retorno assíncrono
    refreshAppointments();
  }, [refreshAppointments]);

  const removeAppointment = useCallback(async (appointmentId) => {
    const { error } = await deleteAppointmentById(appointmentId);
    if (error) return { error };

    setAppointments((prev) => prev.filter((item) => item.id !== appointmentId));
    return { error: null };
  }, []);

  const removeCombo = useCallback(async (comboId) => {
    const { error } = await deleteComboById(comboId);
    if (error) return { error };

    setAppointments((prev) => prev.filter((item) => item.combo_id !== comboId));
    return { error: null };
  }, []);

  return {
    appointments,
    professionals,
    loading,
    error,
    refreshAppointments,
    removeAppointment,
    removeCombo,
  };
}
