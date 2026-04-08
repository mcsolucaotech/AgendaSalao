import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatBRL } from '../lib/money';
import { format, parseISO, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Edit2, Trash2, User,
  Scissors, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    fetchAppointments();
  }, [filter, professionalIdFilter]);

  const fetchAppointments = async () => {
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
  };

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

  const searchLower = search.trim().toLowerCase();
  const filtered = appointments.filter((a) => {
    const profNome = (a.profissionais?.nome || '').toLowerCase();
    const matchesSearch =
      !searchLower ||
      a.cliente_nome.toLowerCase().includes(searchLower) ||
      a.servico.toLowerCase().includes(searchLower) ||
      profNome.includes(searchLower);
    return matchesSearch;
  });

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
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 sm:py-20 glass rounded-2xl sm:rounded-3xl border-lavender-100">
            <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-gray-200 mx-auto mb-3 sm:mb-4" />
            <p className="font-bold text-gray-400 text-sm">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((a, index) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass p-4 sm:p-6 rounded-lg sm:rounded-2xl md:rounded-[2.5rem] border-lavender-100 relative overflow-hidden"
              >
                {/* Info principal */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 font-display mb-1 truncate">{a.cliente_nome}</h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-400 text-[9px] sm:text-xs font-bold flex-wrap">
                      <div className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-lavender-400 flex-shrink-0" />
                        <span className="truncate">{a.servico}</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-200 rounded-full hidden sm:block" />
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-lavender-400 flex-shrink-0" />
                        <span className="truncate">{a.profissionais?.nome || '—'}</span>
                      </div>
                      {a.cliente_telefone && (
                        <>
                          <div className="w-1 h-1 bg-gray-200 rounded-full hidden sm:block" />
                          <span className="truncate">{a.cliente_telefone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-col sm:items-end gap-1 ml-auto sm:ml-2 shrink-0 text-right">
                    <div className="px-2 sm:px-3 py-1 bg-lavender-50 text-lavender-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      {format(parseISO(a.data_hora), 'HH:mm')}
                    </div>
                    {a.valor_cobrado != null && (
                      <div className="text-[10px] sm:text-xs font-black text-gray-900">
                        {formatBRL(a.valor_cobrado)}
                      </div>
                    )}
                    <div className="text-[8px] sm:text-[10px] font-bold text-gray-400">
                      {format(parseISO(a.data_hora), 'dd MMM', { locale: ptBR })}
                    </div>
                    {a.status && (
                      <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${statusColor[a.status] || 'bg-gray-100 text-gray-400'}`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Observação */}
                {a.observacoes && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-2xl border border-gray-100 text-xs font-medium text-gray-500 italic">
                    "{a.observacoes}"
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => onEdit(a)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-100 rounded-lg sm:rounded-2xl text-gray-600 font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center justify-center gap-2 flex-1"
                  >
                    <Edit2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingId(a.id)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-100 rounded-lg sm:rounded-2xl text-gray-400 font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2 flex-1"
                  >
                    <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                    Excluir
                  </button>
                </div>

                {/* Confirmação de exclusão */}
                <AnimatePresence>
                  {deletingId === a.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/96 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center"
                    >
                      <p className="font-black text-gray-900 mb-1 text-sm sm:text-base">Excluir agendamento?</p>
                      <p className="text-xs sm:text-xs text-gray-400 mb-4 sm:mb-5">Esta ação não pode ser desfeita.</p>
                      <div className="flex items-center gap-2 sm:gap-3 w-full">
                        <button
                          onClick={() => setDeletingId(null)}
                          disabled={deleteLoading}
                          className="flex-1 py-2 sm:py-3 glass rounded-lg sm:rounded-2xl text-gray-400 font-bold text-[9px] sm:text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleteLoading}
                          className="flex-1 py-2 sm:py-3 bg-red-600 text-white rounded-lg sm:rounded-2xl font-bold text-[9px] sm:text-xs shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                        >
                          {deleteLoading ? (
                            <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : 'Confirmar'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsManager;
