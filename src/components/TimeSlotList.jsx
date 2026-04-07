import React, { useState, useEffect } from 'react';
import {
  format,
  startOfDay,
  endOfDay,
  parseISO,
  addDays,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scissors, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const TimeSlotList = ({ selectedDate, professionalId, onAddBooking }) => {
  const [dayAppointments, setDayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    const fetchDayAppointments = async () => {
      if (!selectedDate || !professionalId) return;
      
      setLoading(true);
      try {
        // Janela expandida para evitar perda por conversão de fuso horário.
        // Depois filtramos em memória pelo mesmo dia local selecionado.
        const queryStart = startOfDay(addDays(selectedDate, -1));
        const queryEnd = endOfDay(addDays(selectedDate, 1));

        const { data, error } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('profissional_id', professionalId)
          .gte('data_hora', queryStart.toISOString())
          .lte('data_hora', queryEnd.toISOString())
          .order('data_hora', { ascending: true });

        if (error) {
          console.error('TimeSlotList: falha ao buscar agenda do dia:', error.message);
          setDayAppointments([]);
          setLoading(false);
          return;
        }
        const sameDayAppointments = (data || []).filter((appointment) => {
          try {
            return isSameDay(parseISO(appointment.data_hora), selectedDate);
          } catch {
            return false;
          }
        });

        setDayAppointments(sameDayAppointments);
      } finally {
        setLoading(false);
      }
    };

    fetchDayAppointments();
  }, [selectedDate, professionalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-lavender-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-36 sm:pb-40 pt-2 sm:pt-4 px-2 sm:px-4 md:px-0">
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-50">Programação do Dia</span>
        <span className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-70">
          Hoje: {todayLabel}
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 font-display capitalize break-words">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-2 text-lavender-500 font-bold bg-lavender-50 px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs whitespace-nowrap">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {dayAppointments.length} agendados
          </div>
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        <AnimatePresence mode="popLayout">
          {dayAppointments.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/40 border-2 border-dashed border-gray-100 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-gray-300"
            >
              <CalendarIcon className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 opacity-20" />
              <span className="text-xs sm:text-sm font-bold tracking-tight">Nenhuma atividade para esta data</span>
            </motion.div>
          ) : (
            dayAppointments.map((appointment, index) => (
              <motion.div 
                key={appointment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass rounded-lg sm:rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between border-lavender-100 group gap-3"
              >
                <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg sm:rounded-2xl w-12 h-12 sm:w-16 sm:h-16 group-hover:bg-lavender-600 group-hover:text-white transition-colors flex-shrink-0">
                    <span className="text-[8px] sm:text-xs font-black uppercase opacity-40 group-hover:text-white/50">Início</span>
                    <span className="text-base sm:text-lg font-black font-display tracking-tight">
                      {format(parseISO(appointment.data_hora), 'HH:mm')}
                    </span>
                  </div>
                  <div className="border-l border-gray-100 pl-3 sm:pl-5 space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-gray-900 font-black font-display text-sm sm:text-base md:text-lg truncate">
                      {appointment.cliente_nome}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest truncate">
                      <Scissors className="w-3 h-3 text-lavender-400 flex-shrink-0" />
                      <span className="truncate">{appointment.servico}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onAddBooking()}
        type="button"
        aria-label="Novo agendamento"
        className="fixed right-4 sm:right-6 md:right-8 z-[60] bg-gray-900 text-white p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-[2rem] shadow-2xl flex items-center gap-2 md:gap-3 active:bg-lavender-700 transition-all border border-white/10 group overflow-hidden
          bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-lavender-400 to-lavender-700 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Plus className="w-5 sm:w-6 md:w-6 h-5 sm:h-6 md:h-6 relative z-10 flex-shrink-0" />
        <span className="hidden sm:inline font-black font-display tracking-tight text-[10px] md:text-sm uppercase relative z-10 whitespace-nowrap">
          Novo agendamento
        </span>
      </motion.button>
    </div>
  );
};

export default TimeSlotList;
