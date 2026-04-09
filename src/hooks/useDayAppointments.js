import { useCallback, useEffect, useState } from 'react';
import { fetchAppointmentsByDay } from '../services/appointmentsService';

export function useDayAppointments({ selectedDate, professionalId }) {
  const [dayAppointments, setDayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshDayAppointments = useCallback(async () => {
    if (!selectedDate || (!professionalId && professionalId !== null)) return;

    setLoading(true);
    try {
      const { data, error } = await fetchAppointmentsByDay({
        selectedDate,
        professionalId,
      });

      if (error) {
        setDayAppointments([]);
        return;
      }

      setDayAppointments(data || []);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, professionalId]);

  useEffect(() => {
    refreshDayAppointments();
  }, [refreshDayAppointments]);

  return {
    dayAppointments,
    loading,
    refreshDayAppointments,
  };
}
