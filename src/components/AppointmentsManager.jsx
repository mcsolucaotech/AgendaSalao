import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatBRL } from '../lib/money';
import { format, parseISO, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Edit2, Trash2, User,
  Scissors, AlertCircle, Loader2, Package
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const AppointmentsManager = ({ onEdit }) => {
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'all'
  const [professionalIdFilter, setProfessionalIdFilter] = useState(''); // '' = todas
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const loadProfessionals = async () => {
      const { data, error: err } = await supabase
        .from('profissionais')
        .select('id, nome')
        .order('nome');
      if (!err && data) setProfessionals(data);
    };
    loadProfessionals();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('agendamentos')
      .select(`
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
      `)
      .order('data_hora', { ascending: true });

    if (filter === 'upcoming') {
      query = query.gte('data_hora', startOfToday().toISOString());
    }

    if (professionalIdFilter) {
      query = query.eq('profissional_id', professionalIdFilter);
    }

    const { data, error: err } = await query;

    if (err) {
      setError('Não foi possível carregar os agendamentos.');
      setLoading(false);
      return;
    }

    setAppointments(data || []);
    setLoading(false);
  }, [filter, professionalIdFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- atualização de estado ocorre dentro da função assíncrona de busca
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDelete = async (id) => {
    setDeleteLoading(true);

    const { error: err } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (err) {
      // Exibe o erro brevemente e fecha o overlay
      console.error('Erro ao excluir:', err.message);
    } else {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }

    setDeletingId(null);
    setDeleteLoading(false);
  };

  const searchLower = deferredSearch.trim().toLowerCase();
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const profNome = (a.profissionais?.nome || '').toLowerCase();
      const cliente = (a.cliente_nome || '').toLowerCase();
      const servico = (a.servico || '').toLowerCase();
      return !searchLower || cliente.includes(searchLower) || servico.includes(searchLower) || profNome.includes(searchLower);
    });
  }, [appointments, searchLower]);

  // Agrupa combos pelo combo_id sem reprocessamento quadrático
  const grouped = useMemo(() => {
    const byCombo = new Map();
    const result = [];
    for (const a of filtered) {
      if (a.combo_id) {
        if (!byCombo.has(a.combo_id)) {
          const group = { type: 'combo', id: a.combo_id, items: [] };
          byCombo.set(a.combo_id, group);
          result.push(group);
        }
        byCombo.get(a.combo_id).items.push(a);
      } else {
        result.push({ type: 'single', id: a.id, item: a });
      }
    }
    return result;
  }, [filtered]);

  // ---- Status badge color ----
  const statusColor = {
    Confirmado: 'bg-green-50 text-green-600',
    Pendente: 'bg-yellow-50 text-yellow-600',
    Cancelado: 'bg-red-50 text-red-400',
    Finalizado: 'bg-gray-100 text-gray-400',
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0">
      {/* Busca e filtros */}
      <div className="space-y-3 sm:space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400 group-focus-within:text-lavender-500 transition-colors flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço ou funcionária..."
            className="w-full pl-11 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 md:py-5 glass rounded-lg sm:rounded-2xl border-lavender-100 focus:ring-2 focus:ring-lavender-500 outline-none font-bold text-gray-900 transition-all shadow-sm text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Período</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {['upcoming', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0
                  ${filter === f ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}
                `}
              >
                {f === 'upcoming' ? 'Próximos' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Funcionária</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setProfessionalIdFilter('')}
              className={`px-4 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0
                ${professionalIdFilter === '' ? 'bg-lavender-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}
              `}
            >
              Todas
            </button>
            {professionals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfessionalIdFilter(p.id)}
                className={`px-4 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 max-w-[200px] truncate
                  ${professionalIdFilter === p.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'}
                `}
                title={p.nome}
              >
                {p.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 opacity-50">
            <Loader2 className="w-7 sm:w-8 h-7 sm:h-8 animate-spin text-lavender-600 mb-3 sm:mb-4" />
            <p className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400">Carregando...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 sm:py-16 glass rounded-2xl sm:rounded-3xl border-lavender-100">
            <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-red-300 mx-auto mb-3 sm:mb-4" />
            <p className="font-bold text-gray-400 text-sm">{error}</p>
            <button
              onClick={fetchAppointments}
              className="mt-3 sm:mt-4 text-xs text-lavender-500 font-bold underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 sm:py-20 glass rounded-2xl sm:rounded-3xl border-lavender-100">
            <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-gray-200 mx-auto mb-3 sm:mb-4" />
            <p className="font-bold text-gray-400 text-sm">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((group, index) => (
              <Motion.div key={group.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>

                {/* ── Agendamento normal ── */}
                {group.type === 'single' && (() => {
                  const a = group.item;
                  return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                      <div className="flex items-stretch">
                        {/* Faixa horário */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 w-16 py-4 flex-shrink-0 border-r border-gray-100">
                          <span className="text-[8px] font-black uppercase text-gray-300">início</span>
                          <span className="text-sm font-black text-gray-700 font-display">{format(parseISO(a.data_hora), 'HH:mm')}</span>
                          <span className="text-[9px] text-gray-400 mt-0.5">{format(parseISO(a.data_hora), 'dd/MM', { locale: ptBR })}</span>
                        </div>
                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-sm truncate">{a.cliente_nome}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                  <Scissors className="w-2.5 h-2.5 text-lavender-400" />{a.servico}
                                </span>
                                {a.profissionais?.nome && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                    <User className="w-2.5 h-2.5 text-lavender-300" />{a.profissionais.nome}
                                  </span>
                                )}
                                {a.cliente_telefone && (
                                  <span className="text-[10px] text-gray-400">{a.cliente_telefone}</span>
                                )}
                              </div>
                              {a.observacoes && (
                                <p className="text-[10px] text-gray-400 italic mt-1">"{a.observacoes}"</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {a.valor_cobrado != null && (
                                <span className="text-xs font-black text-lavender-600">{formatBRL(a.valor_cobrado)}</span>
                              )}
                              {a.status && (
                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[a.status] || 'bg-gray-100 text-gray-400'}`}>
                                  {a.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Ações */}
                      <div className="flex border-t border-gray-50">
                        <button onClick={() => onEdit(a)}
                          className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lavender-600 hover:bg-lavender-50 transition-all flex items-center justify-center gap-1.5">
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <div className="w-px bg-gray-50" />
                        <button onClick={() => setDeletingId(a.id)}
                          className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                      {/* Confirmação exclusão */}
                      <AnimatePresence>
                        {deletingId === a.id && (
                          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/96 z-10 flex flex-col items-center justify-center p-4 text-center">
                            <p className="font-black text-gray-900 mb-1 text-sm">Excluir agendamento?</p>
                            <p className="text-xs text-gray-400 mb-4">Esta ação não pode ser desfeita.</p>
                            <div className="flex gap-2 w-full">
                              <button onClick={() => setDeletingId(null)} disabled={deleteLoading}
                                className="flex-1 py-2 bg-gray-100 rounded-xl text-gray-500 font-bold text-xs">Cancelar</button>
                              <button onClick={() => handleDelete(a.id)} disabled={deleteLoading}
                                className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                                {deleteLoading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Confirmar'}
                              </button>
                            </div>
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* ── Combo ── */}
                {group.type === 'combo' && (
                  <div className="rounded-2xl overflow-hidden border-2 border-lavender-200">
                    {/* Header do combo */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-lavender-600">
                      <Package className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Combo</span>
                      <span className="text-[10px] text-lavender-200 font-bold truncate flex-1">{group.items[0].cliente_nome}</span>
                      {group.items[0].cliente_telefone && (
                        <span className="text-[10px] text-lavender-300 flex-shrink-0">{group.items[0].cliente_telefone}</span>
                      )}
                      <span className="text-[10px] font-black text-white bg-lavender-500 px-2 py-0.5 rounded-full flex-shrink-0">
                        {formatBRL(group.items.reduce((s, x) => s + (Number(x.valor_cobrado) || 0), 0))}
                      </span>
                    </div>
                    {/* Itens */}
                    <div className="divide-y divide-lavender-100 bg-white">
                      {group.items.map((a) => (
                        <div key={a.id} className="flex items-center gap-0">
                          <div className="flex flex-col items-center justify-center w-14 self-stretch py-3 bg-lavender-50 flex-shrink-0">
                            <span className="text-[8px] font-black text-lavender-300 uppercase">início</span>
                            <span className="text-xs font-black text-lavender-700">{format(parseISO(a.data_hora), 'HH:mm')}</span>
                          </div>
                          <div className="flex-1 min-w-0 px-3 py-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 text-[10px] font-black text-gray-700">
                                <Scissors className="w-2.5 h-2.5 text-lavender-400" />{a.servico}
                              </span>
                              {a.profissionais?.nome && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                  <User className="w-2.5 h-2.5 text-lavender-300" />{a.profissionais.nome}
                                </span>
                              )}
                            </div>
                            {a.observacoes && (
                              <span className="text-[9px] text-lavender-400 font-bold">{a.observacoes}</span>
                            )}
                          </div>
                          <span className="text-xs font-black text-lavender-600 pr-3 flex-shrink-0">{formatBRL(a.valor_cobrado)}</span>
                          <button onClick={() => onEdit(a)}
                            className="w-10 self-stretch flex items-center justify-center text-lavender-300 hover:text-lavender-600 hover:bg-lavender-50 transition-all border-l border-lavender-100 flex-shrink-0">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Ação excluir combo inteiro */}
                    <div className="border-t border-lavender-100 bg-white">
                      <button onClick={() => setDeletingId(group.id)}
                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5">
                        <Trash2 className="w-3 h-3" /> Excluir combo
                      </button>
                    </div>
                    {/* Confirmação exclusão combo */}
                    <AnimatePresence>
                      {deletingId === group.id && (
                        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="relative bg-white border-t border-lavender-100 p-4 text-center">
                          <p className="font-black text-gray-900 mb-1 text-sm">Excluir combo inteiro?</p>
                          <p className="text-xs text-gray-400 mb-3">Todos os {group.items.length} serviços serão removidos.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeletingId(null)} disabled={deleteLoading}
                              className="flex-1 py-2 bg-gray-100 rounded-xl text-gray-500 font-bold text-xs">Cancelar</button>
                            <button
                              onClick={async () => {
                                setDeleteLoading(true);
                                const { error: deleteError } = await supabase.from('agendamentos').delete().eq('combo_id', group.id);
                                if (!deleteError) {
                                  setAppointments(prev => prev.filter(a => a.combo_id !== group.id));
                                }
                                setDeletingId(null);
                                setDeleteLoading(false);
                              }}
                              disabled={deleteLoading}
                              className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                              {deleteLoading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Confirmar'}
                            </button>
                          </div>
                        </Motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsManager;
