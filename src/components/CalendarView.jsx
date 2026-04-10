import React, { useEffect, useMemo, useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  startOfDay,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion as Motion } from 'framer-motion';

const CalendarView = ({ selectedDate, onDateSelect, professionalId, refreshTrigger = 0 }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!professionalId && professionalId !== null) return;

      try {
        const firstDay = startOfMonth(currentMonth);
        const lastDay = endOfMonth(currentMonth);

        let query = supabase
          .from('agendamentos')
          .select('data_hora')
          .gte('data_hora', firstDay.toISOString())
          .lte('data_hora', lastDay.toISOString());

        if (professionalId) {
          query = query.eq('profissional_id', professionalId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('CalendarView: falha ao buscar marcadores:', error.message);
          setAppointments([]);
          return;
        }
        setAppointments(data || []);
      } catch (err) {
        console.error('CalendarView: erro inesperado:', err.message);
        setAppointments([]);
      }
    };

    fetchAppointments();
  }, [currentMonth, professionalId, refreshTrigger]);

  const appointmentDayCounts = useMemo(() => {
    const counts = new Map();
    for (const app of appointments) {
      try {
        const parsed = parseISO(app.data_hora);
        const key = format(parsed, 'yyyy-MM-dd');
        counts.set(key, (counts.get(key) || 0) + 1);
      } catch {
        // ignora registros inválidos para evitar quebrar a renderização
      }
    }
    return counts;
  }, [appointments]);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 font-display">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
        <p className="text-xs sm:text-sm text-gray-500">Selecione a data desejada</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2 sm:mb-4 gap-0.5">
        {days.map((day) => (
          <div key={day} className="text-center text-[7px] sm:text-xs font-black text-gray-300 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const today = startOfDay(new Date());

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const d = day;
        const isPast = isBefore(startOfDay(d), today);
        const isSelected = isSameDay(d, selectedDate);
        const isCurrentMonth = isSameMonth(d, monthStart);
        
        const dayKey = format(d, 'yyyy-MM-dd');
        const appointmentCount = appointmentDayCounts.get(dayKey) || 0;
        const hasAppointment = appointmentCount > 0;

        days.push(
          <Motion.div
            key={d.toString()}
            whileTap={!isPast ? { scale: 0.9 } : {}}
            className={`
              relative h-10 sm:h-12 md:h-14 flex items-center justify-center cursor-pointer transition-all duration-300 rounded-lg sm:rounded-2xl
              ${!isCurrentMonth ? 'text-gray-200' : ''}
              ${isPast ? 'cursor-not-allowed opacity-30 text-gray-400' : 'hover:bg-lavender-50'}
              ${isSelected ? 'bg-lavender-600 text-white shadow-xl shadow-lavender-200 z-10' : ''}
              ${!isPast && hasAppointment && !isSelected ? 'ring-2 ring-lavender-400 ring-opacity-50' : ''}
            `}
            onClick={() => !isPast && onDateSelect(d)}
          >
            {isSelected && (
              <Motion.div 
                layoutId="calendar-selection"
                className="absolute inset-0 bg-lavender-600 rounded-lg sm:rounded-2xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 font-bold text-xs sm:text-sm md:text-base">
              {format(d, 'd')}
            </span>
            {!isPast && hasAppointment && (
              <div
                className={`
                  absolute -bottom-1 sm:-bottom-1.5 z-20
                  min-w-4 h-4 px-1 rounded-full
                  flex items-center justify-center
                  text-[9px] leading-none font-black shadow-sm
                  ${isSelected ? 'bg-white text-lavender-700' : 'bg-lavender-600 text-white'}
                `}
              >
                {appointmentCount > 9 ? '9+' : appointmentCount}
              </div>
            )}
            {isSameDay(d, today) && !isSelected && (
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-400 rounded-full z-20 shadow-sm" />
            )}
          </Motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="bg-white/50 backdrop-blur-md p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] border border-white premium-shadow">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default CalendarView;
