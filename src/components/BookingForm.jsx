import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X, User, Phone, Clock, ChevronLeft, ChevronRight,
  Scissors, Sparkles, Star, Zap, ShoppingBag, Check, Banknote
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { formatBRL } from '../lib/money';
import {
  formatCurrencyFromNumber,
  formatCurrencyMask,
  isValidIsoDate,
  parseCurrencyInput,
  sanitizePhone,
  sanitizeText,
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
} from '../lib/validation';

// ---------------------------------------------------------------------------
// BookingForm — wizard de 3 passos para criar ou editar um agendamento
// ---------------------------------------------------------------------------
const BookingForm = ({ selectedDate, professionalId, onClose, onSave, initialData = null }) => {
  const needsProfessionalStep = !professionalId && !initialData;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [professionals, setProfessionals] = useState([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(true);
  const [precoModo, setPrecoModo] = useState('padrao');
  const [valorPersonalizado, setValorPersonalizado] = useState('');
  const selectedSlotRef = useRef(null);

  const [formData, setFormData] = useState({
    cliente_nome: initialData?.cliente_nome || '',
    cliente_telefone: initialData?.cliente_telefone || '',
    servico: initialData?.servico || '',
    servico_id: initialData?.servico_id || '',
    data_hora: initialData?.data_hora || '',
    observacoes: initialData?.observacoes || '',
    profissional_id: initialData?.profissional_id || professionalId,
  });

  const isEditing = !!initialData;

  // Buscar serviços e profissionais do banco
  // (dependências parciais de initialData evitam re-fetch desnecessário ao re-render do pai)
  useEffect(() => {
    const fetchData = async () => {
      setServicesLoading(true);
      setProfessionalsLoading(true);

      const [servicesRes, professionalsRes] = await Promise.all([
        supabase.from('servicos').select('*').order('descricao'),
        supabase.from('profissionais').select('id, nome').order('nome')
      ]);

      if (servicesRes.error) {
        console.error('Erro ao buscar serviços:', servicesRes.error);
      } else {
        const list = servicesRes.data || [];
        setServices(list);
        if (!isEditing && list.length > 0) {
          const first = list[0];
          setFormData(prev => ({
            ...prev,
            servico: first.descricao,
            servico_id: first.id
          }));
          setPrecoModo('padrao');
          setValorPersonalizado(formatCurrencyFromNumber(first.preco));
        } else if (isEditing && initialData && list.length > 0) {
          const svc = list.find((s) => s.id === initialData.servico_id)
            || list.find((s) => s.descricao === initialData.servico);
          const precoTabela = svc != null ? Number(svc.preco) : null;
          const cobrado =
            initialData.valor_cobrado != null && initialData.valor_cobrado !== ''
              ? Number(initialData.valor_cobrado)
              : precoTabela;
          if (precoTabela != null && cobrado != null && !Number.isNaN(cobrado) && Math.abs(precoTabela - cobrado) < 0.009) {
            setPrecoModo('padrao');
            setValorPersonalizado(formatCurrencyFromNumber(precoTabela));
          } else if (cobrado != null && !Number.isNaN(cobrado)) {
            setPrecoModo('personalizado');
            setValorPersonalizado(formatCurrencyFromNumber(cobrado));
          } else {
            setPrecoModo('padrao');
            setValorPersonalizado(precoTabela != null ? formatCurrencyFromNumber(precoTabela) : '');
          }
        }
      }

      if (professionalsRes.error) {
        console.error('Erro ao buscar profissionais:', professionalsRes.error);
      } else {
        setProfessionals(professionalsRes.data || []);
      }

      setServicesLoading(false);
      setProfessionalsLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- usa apenas campos de initialData ao abrir criar/editar
  }, [isEditing, initialData?.id, initialData?.servico_id, initialData?.valor_cobrado]);

  // ---------------------------------------------------------------------------
  // Busca horários ocupados **por profissional** e gera slots disponíveis.
  // Regra: o mesmo instante pode ter uma cliente por funcionária; a mesma
  // funcionária não pode ter dois agendamentos no mesmo horário.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !formData.profissional_id) {
        setAvailableSlots([]);
        setSlotsLoading(false);
        return;
      }
      setSlotsLoading(true);
      setAvailableSlots([]);

      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, data_hora')
        .eq('profissional_id', formData.profissional_id)
        .gte('data_hora', start.toISOString())
        .lte('data_hora', end.toISOString());

      // Ao editar, remove só o próprio registro dos ocupados (por id)
      const occupied = new Set((data || [])
        .filter((d) => !isEditing || d.id !== initialData?.id)
        .map((d) => parseISO(d.data_hora).getTime()));

      const slots = [];
      let current = new Date(selectedDate);
      current.setHours(8, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(19, 0, 0, 0);

      const now = new Date();
      const isToday = current.toDateString() === now.toDateString();

      while (current <= dayEnd) {
        const isPast = isToday && current <= now;
        if (!occupied.has(current.getTime()) && !isPast) {
          slots.push(new Date(current));
        }
        current = addMinutes(current, 30);
      }

      if (error) console.warn('Slots: usando todos os horários por falha na consulta', error.message);
      setAvailableSlots(slots);
      setSlotsLoading(false);
    };

    fetchSlots();
  }, [selectedDate, formData.profissional_id, isEditing, initialData?.id]);

  const getSlotsEmptyMessage = () => {
    if (!formData.profissional_id) {
      return 'Selecione uma profissional para ver os horários.';
    }
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(19, 0, 0, 0);
    if (selectedDate.toDateString() === new Date().toDateString() && new Date() > dayEnd) {
      return 'Não há mais horários futuros para hoje. Selecione outra data.';
    }
    return 'Não há horários disponíveis para este dia.';
  };

  // Ao trocar a profissional na edição, o horário escolhido pode passar a ser inválido
  useEffect(() => {
    if (!formData.data_hora || slotsLoading) return;
    const t = parseISO(formData.data_hora).getTime();
    const stillAvailable = availableSlots.some((s) => s.getTime() === t);
    if (!stillAvailable) {
      setFormData((f) => ({ ...f, data_hora: '' }));
      if (step === (needsProfessionalStep ? 4 : 3)) setStep(needsProfessionalStep ? 3 : 2);
    }
  }, [availableSlots, formData.data_hora, needsProfessionalStep, slotsLoading, step]);

  useEffect(() => {
    if (!formData.data_hora || !selectedSlotRef.current) return;
    selectedSlotRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [formData.data_hora, step]);

  // ---------------------------------------------------------------------------
  // Máscara de WhatsApp: (XX) XXXXX-XXXX
  // ---------------------------------------------------------------------------
  const formatWhatsApp = (value) => {
    const digits = sanitizePhone(value);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.servico_id),
    [services, formData.servico_id]
  );
  const precoTabelaServico = selectedService != null ? Number(selectedService.preco) : NaN;

  const resolveValorCobrado = () => {
    if (precoModo === 'padrao') {
      if (Number.isNaN(precoTabelaServico)) return { ok: false, value: null, message: 'Serviço sem preço na tabela.' };
      return { ok: true, value: precoTabelaServico, message: null };
    }
    const n = parseCurrencyInput(valorPersonalizado);
    if (n == null) {
      return { ok: false, value: null, message: 'Informe um valor válido (≥ 0).' };
    }
    return { ok: true, value: n, message: null };
  };

  // ---------------------------------------------------------------------------
  // Submissão: INSERT ou UPDATE
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    const clienteNome = sanitizeText(formData.cliente_nome, MAX_NAME_LENGTH);
    const observacoes = sanitizeText(formData.observacoes, MAX_NOTES_LENGTH);
    if (!clienteNome || !formData.data_hora || !isValidIsoDate(formData.data_hora)) return;
    setLoading(true);
    setSubmitError(null);

    let conflictQuery = supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_id', formData.profissional_id)
      .eq('data_hora', formData.data_hora)
      .limit(1);

    if (isEditing) {
      conflictQuery = conflictQuery.neq('id', initialData.id);
    }

    const { data: conflictRows, error: conflictErr } = await conflictQuery;

    if (conflictErr) {
      setSubmitError('Não foi possível verificar disponibilidade. Tente de novo.');
      setLoading(false);
      return;
    }

    if (conflictRows?.length > 0) {
      setSubmitError(
        'Esta profissional já tem agendamento neste horário. Escolha outro horário ou outra funcionária — o mesmo horário pode ser usado por outras funcionárias.'
      );
      setLoading(false);
      return;
    }

    const { ok, value: valorCobrado, message: priceMsg } = resolveValorCobrado();
    if (!ok || valorCobrado == null) {
      setSubmitError(priceMsg || 'Valor inválido.');
      setLoading(false);
      return;
    }

    const payload = {
      data_hora: formData.data_hora,
      cliente_nome: clienteNome,
      cliente_telefone: formatWhatsApp(formData.cliente_telefone),
      servico: formData.servico,
      servico_id: formData.servico_id,
      profissional_id: formData.profissional_id,
      observacoes,
      valor_cobrado: valorCobrado,
    };

    let err;
    if (isEditing) {
      const res = await supabase.from('agendamentos').update(payload).eq('id', initialData.id);
      err = res.error;
    } else {
      const res = await supabase.from('agendamentos').insert([payload]);
      err = res.error;
    }

    if (err) {
      setSubmitError('Erro ao salvar. Tente novamente.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => onSave(), 1800);
  };

  // Função para obter ícone baseado na categoria
  const getServiceIcon = (categoria) => {
    switch ((categoria || '').toLowerCase()) {
      case 'corte': return <Scissors className="w-5 h-5" />;
      case 'finalização': return <Sparkles className="w-5 h-5" />;
      case 'tratamento': return <Zap className="w-5 h-5" />;
      case 'unhas': return <Star className="w-5 h-5" />;
      case 'cor': return <Sparkles className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  // ---------------------------------------------------------------------------
  // Steps
  // ---------------------------------------------------------------------------
  const renderStep1 = () => (
    <Motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-2 sm:space-y-3">
      {servicesLoading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-8 sm:py-10 text-gray-400 font-bold text-sm">
          Nenhum serviço disponível.
        </div>
      ) : (
        services.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setFormData(f => ({
                ...f,
                servico: s.descricao,
                servico_id: s.id
              }));
              setPrecoModo('padrao');
              setValorPersonalizado(formatCurrencyFromNumber(s.preco));
              setStep(needsProfessionalStep ? 3 : 2);
            }}
            className={`
              w-full p-3 sm:p-4 rounded-lg sm:rounded-2xl md:rounded-3xl border-2 transition-all flex items-center justify-between group
              ${formData.servico === s.descricao ? 'border-lavender-600 bg-lavender-50' : 'border-gray-100 hover:border-lavender-200 bg-white'}
            `}
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-2xl transition-colors flex-shrink-0 ${formData.servico === s.descricao ? 'bg-lavender-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-lavender-100'}`}>
                <div className="w-4 h-4 sm:w-5 sm:h-5">
                  {getServiceIcon(s.categoria)}
                </div>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-lavender-400 mb-0.5">{s.categoria}</p>
                <p className="font-bold text-gray-800 text-sm truncate">{s.descricao}</p>
              </div>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <p className="font-black text-lavender-600 text-sm sm:text-base">R$ {s.preco.toFixed(2)}</p>
              <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4 text-gray-300 ml-auto hidden sm:block" />
            </div>
          </button>
        ))
      )}
    </Motion.div>
  );

  const renderStep2 = () => (
    <Motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-3 sm:space-y-4">
      {slotsLoading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin" />
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8 sm:py-10 text-gray-400 font-bold text-sm">
          {getSlotsEmptyMessage()}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {availableSlots.map(slot => {
            const selectedMs = formData.data_hora ? parseISO(formData.data_hora).getTime() : null;
            const isSlotSelected = selectedMs !== null && slot.getTime() === selectedMs;
            const isCurrentSlot = isEditing && initialData?.data_hora
              && slot.getTime() === parseISO(initialData.data_hora).getTime();
            return (
              <button
                key={slot.toISOString()}
                ref={isSlotSelected ? selectedSlotRef : null}
                onClick={() => { setFormData(f => ({ ...f, data_hora: slot.toISOString() })); setStep(needsProfessionalStep ? 4 : 3); }}
                className={`
                  relative py-3 sm:py-4 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm transition-all
                  ${isSlotSelected
                    ? 'bg-lavender-600 text-white shadow-xl shadow-lavender-200 ring-2 ring-lavender-400 ring-offset-1'
                    : 'bg-gray-50 text-gray-500 hover:bg-lavender-50'}
                `}
              >
                {format(slot, 'HH:mm')}
                {isCurrentSlot && !isSlotSelected && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-lavender-100 text-lavender-600 px-1 py-0.5 rounded-full leading-none">
                    atual
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Motion.div>
  );

  const renderStep3 = () => {
    const precificacao = resolveValorCobrado();
    return (
    <Motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4 sm:space-y-5">
      <div className="space-y-3 sm:space-y-4">
        {/* Nome */}
        <div className="relative">
          <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-300 flex-shrink-0" />
          <input
            type="text"
            placeholder="Nome da Cliente"
            maxLength={MAX_NAME_LENGTH}
            className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-4 md:py-5 bg-gray-50 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none font-bold text-sm"
            value={formData.cliente_nome}
            onChange={e => setFormData(f => ({ ...f, cliente_nome: e.target.value }))}
          />
        </div>

        {/* WhatsApp com máscara */}
        <div className="relative">
          <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-300 flex-shrink-0" />
          <input
            type="tel"
            placeholder="WhatsApp (DD) 00000-0000"
            className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-4 md:py-5 bg-gray-50 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none font-bold text-sm"
            value={formData.cliente_telefone}
            onChange={e => setFormData(f => ({ ...f, cliente_telefone: formatWhatsApp(e.target.value) }))}
          />
        </div>

        {/* Observações */}
        <textarea
          placeholder="Observações (opcional)"
          rows={3}
          maxLength={MAX_NOTES_LENGTH}
          className="w-full p-3 sm:p-4 md:p-5 bg-gray-50 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none font-bold resize-none text-sm"
          value={formData.observacoes}
          onChange={e => setFormData(f => ({ ...f, observacoes: e.target.value }))}
        />

        {/* Valor cobrado: tabela ou personalizado */}
        {selectedService && (
          <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <Banknote className="w-3.5 h-3.5 text-lavender-500" />
              Valor do agendamento
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Preço na tabela: <span className="font-bold text-gray-800">{formatBRL(precoTabelaServico)}</span>
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="preco-modo"
                  className="w-4 h-4 accent-lavender-600"
                  checked={precoModo === 'padrao'}
                  onChange={() => {
                    setPrecoModo('padrao');
                    if (!Number.isNaN(precoTabelaServico)) setValorPersonalizado(formatCurrencyFromNumber(precoTabelaServico));
                  }}
                />
                <span className="text-sm font-bold text-gray-800">Usar preço da tabela</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="preco-modo"
                  className="w-4 h-4 mt-0.5 accent-lavender-600"
                  checked={precoModo === 'personalizado'}
                  onChange={() => {
                    setPrecoModo('personalizado');
                    if (!String(valorPersonalizado).trim() && !Number.isNaN(precoTabelaServico)) {
                      setValorPersonalizado(formatCurrencyFromNumber(precoTabelaServico));
                    }
                  }}
                />
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-gray-800 block">Outro valor neste agendamento</span>
                  {precoModo === 'personalizado' && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-gray-500 font-black text-sm">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        className="flex-1 min-w-0 py-2.5 px-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-lavender-500 outline-none font-bold text-sm"
                        value={valorPersonalizado}
                        onChange={(e) => setValorPersonalizado(formatCurrencyMask(e.target.value))}
                      />
                    </div>
                  )}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Seletor de Profissional — apenas ao editar */}
        {isEditing && !professionalsLoading && professionals.length > 0 && (
          <div>
            <label className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">
              Trocar Profissional
            </label>
            <div className="space-y-2">
              {professionals.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => setFormData(f => ({ ...f, profissional_id: prof.id }))}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-2xl border-2 font-bold transition-all text-sm ${
                    formData.profissional_id === prof.id
                      ? 'border-lavender-600 bg-lavender-50 text-gray-900'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-lavender-200'
                  }`}
                >
                  {prof.nome}
                </button>
              ))}
            </div>
            {!isEditing && !formData.profissional_id && (
              <p className="text-[10px] text-red-400 font-bold mt-1.5">Selecione uma profissional para continuar</p>
            )}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="p-5 bg-lavender-50 rounded-[2rem] border border-lavender-100 space-y-2">
        <p className="text-[10px] font-black uppercase text-lavender-400 tracking-widest mb-2">Resumo</p>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lavender-600 rounded-lg text-white"><Clock className="w-4 h-4" /></div>
          <span className="font-bold text-gray-800 text-sm">
            {formData.data_hora ? format(parseISO(formData.data_hora), "HH:mm ' — ' d 'de' MMMM", { locale: ptBR }) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lavender-600 rounded-lg text-white"><ShoppingBag className="w-4 h-4" /></div>
          <span className="font-bold text-gray-800 text-sm">{formData.servico}</span>
        </div>
        {selectedService && (
          <div className="flex items-center gap-3 pt-1">
            <div className="p-2 bg-lavender-600 rounded-lg text-white"><Banknote className="w-4 h-4" /></div>
            <span className="font-bold text-lavender-700 text-sm">
              {formatBRL(precificacao.ok ? precificacao.value : precoTabelaServico)}
            </span>
          </div>
        )}
        {formData.profissional_id && professionals.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-lavender-200">
            <div className="p-2 bg-lavender-600 rounded-lg text-white"><User className="w-4 h-4" /></div>
            <span className="font-bold text-gray-800 text-sm">
              {professionals.find(p => p.id === formData.profissional_id)?.nome || '—'}
            </span>
          </div>
        )}
      </div>

      {/* Erro de submit */}
      {submitError && (
        <p className="text-red-500 text-xs font-bold text-center">{submitError}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={
          loading
          || !formData.cliente_nome
          || !formData.data_hora
          || !precificacao.ok
        }
        className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          : isEditing ? 'Atualizar Agendamento' : 'Confirmar Agendamento'
        }
      </button>
    </Motion.div>
    );
  };

  const stepTitles = needsProfessionalStep
    ? ['Quem vai atender?', 'Qual serviço?', 'Escolha o horário', 'Dados da cliente']
    : ['Qual serviço?', 'Escolha o horário', 'Dados da cliente'];

  const totalSteps = stepTitles.length;

  const renderStep0 = () => (
    <Motion.div key="s0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-2 sm:space-y-3">
      {professionalsLoading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin" />
        </div>
      ) : (
        professionals.map((prof) => (
          <button
            key={prof.id}
            onClick={() => {
              setFormData(f => ({ ...f, profissional_id: prof.id }));
              setStep(2);
            }}
            className={`
              w-full p-3 sm:p-4 rounded-lg sm:rounded-2xl border-2 transition-all flex items-center gap-4
              ${formData.profissional_id === prof.id
                ? 'border-lavender-600 bg-lavender-50'
                : 'border-gray-100 bg-white hover:border-lavender-200'}
            `}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${formData.profissional_id === prof.id ? 'bg-lavender-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {prof.nome.split(' ').slice(0, 2).map(p => p[0]).join('')}
            </div>
            <span className="font-bold text-gray-900 text-sm">{prof.nome}</span>
          </button>
        ))
      )}
    </Motion.div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-md">
      <Motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-t-2xl sm:rounded-t-3xl md:rounded-[3rem] md:rounded-b-[3rem] shadow-2xl overflow-hidden max-h-[92vh] md:max-h-[90vh] flex flex-col relative"
      >
        {/* Tela de sucesso */}
        {success && (
          <div className="absolute inset-0 z-[110] bg-white/97 flex flex-col items-center justify-center p-6 sm:p-10 text-center">
            <Motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-16 h-16 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Check className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
            </Motion.div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-1 sm:mb-2 font-display">
              {isEditing ? 'Atualizado!' : 'Confirmado!'}
            </h2>
            <p className="text-gray-400 font-medium text-sm">Agendamento salvo com sucesso.</p>
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 lg:p-9 overflow-y-auto">
          {/* Header do modal */}
          <div className="flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-2xl text-gray-400 hover:text-lavender-600 transition-all flex-shrink-0">
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 font-display truncate">
                  {isEditing ? 'Editar Agendamento' : stepTitles[step - 1]}
                </h2>
                <p className="text-lavender-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-0.5">
                  Passo {step} de {totalSteps}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-2xl text-gray-400 hover:text-red-500 transition-all flex-shrink-0">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Conteúdo do step */}
          <AnimatePresence mode="wait">
            {step === 1 && needsProfessionalStep && renderStep0()}
            {step === (needsProfessionalStep ? 2 : 1) && renderStep1()}
            {step === (needsProfessionalStep ? 3 : 2) && renderStep2()}
            {step === (needsProfessionalStep ? 4 : 3) && renderStep3()}
          </AnimatePresence>
        </div>
      </Motion.div>
    </div>
  );
};

export default BookingForm;
