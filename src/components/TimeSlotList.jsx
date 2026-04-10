import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scissors, Loader2, Calendar as CalendarIcon, Clock, Edit2, User, Package } from 'lucide-react';
import { formatBRL } from '../lib/money';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { groupAppointmentsByCombo } from '../lib/appointments';
import { useDayAppointments } from '../hooks/useDayAppointments';

const TimeSlotList = ({ selectedDate, professionalId, onAddBooking, onAddCombo, onEdit }) => {
  const { dayAppointments, loading } = useDayAppointments({ selectedDate, professionalId });
  const todayLabel = useMemo(
    () => format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }),
    []
  );

  // Agrupa combos pelo combo_id sem custo quadrático
  const grouped = useMemo(() => groupAppointmentsByCombo(dayAppointments), [dayAppointments]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-lavender-500" />
    </div>
  );

  return (
    <div className="space-y-4 pb-40 pt-1 px-1 sm:px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest opacity-50">Programação do Dia</span>
        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider opacity-70">Hoje: {todayLabel}</span>
        <div className="flex items-center justify-between gap-2 mt-1">
          <h3 className="text-sm sm:text-lg font-black text-gray-900 font-display capitalize min-w-0">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-1 text-lavender-500 font-bold bg-lavender-50 px-2.5 py-1 rounded-full text-[9px] whitespace-nowrap flex-shrink-0">
            <Clock className="w-3 h-3" />
            {dayAppointments.length} agendados
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {grouped.length === 0 ? (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/40 border-2 border-dashed border-gray-100 rounded-2xl p-10 flex flex-col items-center text-gray-300">
              <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
              <span className="text-xs font-bold">Nenhuma atividade para esta data</span>
            </Motion.div>
          ) : grouped.map((group, index) => (
            <Motion.div key={group.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}>

              {/* ── Agendamento normal ── */}
              {group.type === 'single' && (() => {
                const a = group.item;
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-stretch overflow-hidden">
                    <div className="flex flex-col items-center justify-center bg-gray-50 w-12 sm:w-14 py-3 flex-shrink-0">
                      <span className="text-[8px] font-black uppercase text-gray-300">início</span>
                      <span className="text-xs sm:text-sm font-black text-gray-700 font-display">{format(parseISO(a.data_hora), 'HH:mm')}</span>
                    </div>
                    <div className="flex-1 min-w-0 px-3 py-3">
                      <p className="font-black text-gray-900 text-[15px] sm:text-base leading-tight truncate">{a.cliente_nome}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lavender-50 text-[11px] text-lavender-700 font-black">
                          <Scissors className="w-3 h-3 text-lavender-500" />{a.servico}
                        </span>
                        {a.profissionais?.nome && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600 font-black">
                            <User className="w-3 h-3 text-lavender-400" />{a.profissionais.nome}
                          </span>
                        )}
                      </div>
                      {a.valor_cobrado != null && (
                        <span className="text-[11px] font-black text-lavender-600 mt-0.5 block">{formatBRL(a.valor_cobrado)}</span>
                      )}
                    </div>
                    {onEdit && (
                      <button onClick={() => onEdit(a)}
                        className="w-9 sm:w-10 flex items-center justify-center text-gray-300 hover:text-lavender-600 hover:bg-lavender-50 transition-all flex-shrink-0">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* ── Combo ── */}
              {group.type === 'combo' && (
                <div className="rounded-2xl overflow-hidden border-2 border-lavender-200">
                  <div className="flex items-center gap-2 px-3 py-2 bg-lavender-600 flex-wrap">
                    <Package className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Combo</span>
                    <span className="text-sm text-white font-black ml-auto truncate max-w-[58%] sm:max-w-[55%]">{group.items[0].cliente_nome}</span>
                    <span className="text-[10px] font-black text-white bg-lavender-500 px-2 py-0.5 rounded-full">
                      {formatBRL(group.items.reduce((s, x) => s + (Number(x.valor_cobrado) || 0), 0))}
                    </span>
                  </div>
                  <div className="divide-y divide-lavender-100 bg-white">
                    {group.items.map((a, i) => (
                      <div key={a.id} className="flex items-stretch">
                        <div className="flex flex-col items-center justify-center w-12 py-2.5 flex-shrink-0 bg-lavender-50">
                          <span className="text-[8px] font-black text-lavender-300 uppercase">{i === 0 ? 'início' : ''}</span>
                          <span className="text-xs font-black text-lavender-700">{format(parseISO(a.data_hora), 'HH:mm')}</span>
                        </div>
                        <div className="flex-1 min-w-0 px-3 py-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lavender-50 text-[11px] font-black text-lavender-700">
                              <Scissors className="w-3 h-3 text-lavender-500" />{a.servico}
                            </span>
                            {a.profissionais?.nome && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600 font-black">
                                <User className="w-3 h-3 text-lavender-400" />{a.profissionais.nome}
                              </span>
                            )}
                          </div>
                          {a.observacoes && (
                            <span className="text-[9px] text-lavender-400 font-bold">{a.observacoes}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-black text-lavender-600 pr-2 flex-shrink-0 self-center">{formatBRL(a.valor_cobrado)}</span>
                        {onEdit && (
                          <button onClick={() => onEdit(a)}
                            className="w-9 flex items-center justify-center text-lavender-300 hover:text-lavender-600 hover:bg-lavender-100 transition-all flex-shrink-0 border-l border-lavender-100">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* FABs */}
      <div className="fixed right-3 sm:right-6 z-[60] flex flex-col items-end gap-2 bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))]">
        <Motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onAddCombo?.()} type="button"
          className="bg-white text-lavender-600 border-2 border-lavender-200 px-3.5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 transition-all">
          <Package className="w-4 h-4" />
          <span className="font-black text-[10px] uppercase tracking-wide hidden sm:inline">Combo</span>
        </Motion.button>
        <Motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onAddBooking()} type="button"
          className="relative bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transition-all border border-white/10 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-lavender-400 to-lavender-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="w-5 h-5 relative z-10" />
          <span className="font-black text-[10px] uppercase tracking-wide relative z-10 hidden sm:inline">Novo agendamento</span>
        </Motion.button>
      </div>
    </div>
  );
};

export default TimeSlotList;
