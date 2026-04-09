import { useState, useEffect } from 'react';
import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, User, Phone, Check, Plus, Trash2, Package, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { formatBRL } from '../lib/money';

async function fetchSlots(profissionalId, date, excludeIds = []) {
  const { data } = await supabase
    .from('agendamentos')
    .select('id, data_hora')
    .eq('profissional_id', profissionalId)
    .gte('data_hora', startOfDay(date).toISOString())
    .lte('data_hora', endOfDay(date).toISOString());

  const occupied = (data || [])
    .filter(d => !excludeIds.includes(d.id))
    .map(d => parseISO(d.data_hora).getTime());
  const slots = [];
  let cur = new Date(date); cur.setHours(8, 0, 0, 0);
  const end = new Date(date); end.setHours(19, 0, 0, 0);
  const now = new Date();
  const isToday = cur.toDateString() === now.toDateString();

  while (cur <= end) {
    if (!occupied.includes(cur.getTime()) && !(isToday && cur <= now))
      slots.push(new Date(cur));
    cur = addMinutes(cur, 30);
  }
  return slots;
}

// ── Item card ───────────────────────────────────────────────────────────────
function ItemCard({ index, item, professionals, services, selectedDate, onChange, onRemove, canRemove }) {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pickingSlot, setPickingSlot] = useState(false);
  const [rangeStart, setRangeStart] = useState(null);

  useEffect(() => {
    if (!item.profissional_id) return;
    setLoadingSlots(true);
    fetchSlots(item.profissional_id, selectedDate, item.id ? [item.id] : []).then(s => {
      setSlots(s);
      setLoadingSlots(false);
    });
  }, [item.profissional_id, selectedDate]);

  const prof = professionals.find(p => p.id === item.profissional_id);
  const svc  = services.find(s => s.id === item.servico_id);
  const val  = parseFloat(String(item.valor).replace(',', '.'));
  const isComplete = item.profissional_id && item.servico_id && item.data_hora && item.valor;

  const startMs = item.data_hora     ? parseISO(item.data_hora).getTime()     : null;
  const endMs   = item.data_hora_fim ? parseISO(item.data_hora_fim).getTime() : null;

  const isInRange = (slot) => {
    if (!startMs || !endMs) return false;
    const t = slot.getTime();
    return t > startMs && t < endMs;
  };

  const handleSlotClick = (slot) => {
    if (!rangeStart) {
      // primeiro clique — define início, aguarda segundo
      setRangeStart(slot);
      onChange({ ...item, data_hora: slot.toISOString(), data_hora_fim: '' });
    } else if (slot.getTime() === rangeStart.getTime()) {
      // clicou no mesmo slot — confirma como horário único
      onChange({ ...item, data_hora: slot.toISOString(), data_hora_fim: '' });
      setRangeStart(null);
      setPickingSlot(false);
    } else {
      // segundo clique diferente — define range
      const [a, b] = slot.getTime() >= rangeStart.getTime()
        ? [rangeStart, slot] : [slot, rangeStart];
      onChange({ ...item, data_hora: a.toISOString(), data_hora_fim: b.toISOString() });
      setRangeStart(null);
      setPickingSlot(false);
    }
  };

  const rangeLabel = () => {
    if (!item.data_hora) return loadingSlots ? 'Carregando...' : '⏰ Definir horário';
    const s = format(parseISO(item.data_hora), 'HH:mm');
    const e = item.data_hora_fim ? format(parseISO(item.data_hora_fim), 'HH:mm') : null;
    if (rangeStart && !e) return `⏰ ${s} — toque no fim ou no mesmo para confirmar`;
    return e ? `⏰ ${s} → ${e}` : `⏰ ${s}`;
  };

  return (
    <div className={`rounded-2xl border-2 transition-all overflow-hidden ${
      isComplete ? 'border-lavender-200 bg-lavender-50/40' : 'border-gray-100 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
            isComplete ? 'bg-lavender-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {isComplete ? <Check className="w-3 h-3" /> : index + 1}
          </span>
          <span className="text-sm font-black text-gray-700 truncate">
            {svc ? svc.descricao : `Serviço ${index + 1}`}
          </span>
          {prof && <span className="text-xs text-gray-400 flex-shrink-0">· {prof.nome.split(' ')[0]}</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isComplete && <span className="text-xs font-black text-lavender-600">{formatBRL(isNaN(val) ? 0 : val)}</span>}
          {canRemove && (
            <button onClick={onRemove} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 space-y-3">
        {/* Profissional */}
        <div className="flex flex-wrap gap-1.5">
          {professionals.map(p => (
            <button key={p.id}
              onClick={() => onChange({ ...item, profissional_id: p.id, data_hora: '', data_hora_fim: '' })}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                item.profissional_id === p.id ? 'bg-lavender-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-lavender-50'
              }`}>
              {p.nome.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Serviço */}
        <div className="flex flex-wrap gap-1.5">
          {services.map(s => (
            <button key={s.id}
              onClick={() => onChange({ ...item, servico_id: s.id, servico: s.descricao, valor: s.preco.toFixed(2) })}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                item.servico_id === s.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {s.descricao}
            </button>
          ))}
        </div>

        {/* Horário — range picker */}
        {item.profissional_id && (
          <div>
            <button
              onClick={() => { setPickingSlot(v => !v); setRangeStart(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full ${
                isComplete
                  ? 'bg-lavender-100 text-lavender-700'
                  : item.data_hora && !item.data_hora_fim
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-lavender-50'
              }`}>
              <span className="flex-1 text-left">{rangeLabel()}</span>
              {(item.data_hora || item.data_hora_fim) && (
                <span role="button" onClick={e => {
                  e.stopPropagation();
                  onChange({ ...item, data_hora: '', data_hora_fim: '' });
                  setRangeStart(null);
                }} className="text-gray-400 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </span>
              )}
              <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${pickingSlot ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {pickingSlot && (
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {/* Instrução */}
                  <p className={`text-[10px] font-bold text-center mt-2 mb-1 ${rangeStart ? 'text-amber-500' : 'text-gray-400'}`}>
                    {rangeStart
                      ? `Início: ${format(rangeStart, 'HH:mm')} — toque no fim ou no mesmo para horário único`
                      : 'Toque no horário (ou início do período)'}
                  </p>

                  <div className="grid grid-cols-5 gap-1 max-h-36 overflow-y-auto pb-1">
                    {slots.map(slot => {
                      const t = slot.getTime();
                      const isStart  = startMs && t === startMs;
                      const isEnd    = endMs   && t === endMs;
                      const inRange  = isInRange(slot);
                      const isPick   = rangeStart && t === rangeStart.getTime() && !endMs;

                      return (
                        <button key={slot.toISOString()}
                          onClick={() => handleSlotClick(slot)}
                          className={[
                            'py-1.5 rounded-lg text-[11px] font-bold transition-all',
                            isStart || isEnd  ? 'bg-lavender-600 text-white shadow-sm' : '',
                            isPick            ? 'bg-amber-400 text-white' : '',
                            inRange           ? 'bg-lavender-100 text-lavender-700' : '',
                            !isStart && !isEnd && !inRange && !isPick
                              ? 'bg-gray-50 text-gray-600 hover:bg-lavender-50' : '',
                          ].filter(Boolean).join(' ')}>
                          {format(slot, 'HH:mm')}
                        </button>
                      );
                    })}
                    {!loadingSlots && slots.length === 0 && (
                      <p className="col-span-5 text-[11px] text-gray-400 text-center py-2">Sem horários disponíveis</p>
                    )}
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Valor */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold">R$</span>
          <input type="text" inputMode="decimal"
            placeholder={svc ? svc.preco.toFixed(2) : '0,00'}
            value={item.valor}
            onChange={e => onChange({ ...item, valor: e.target.value })}
            className="flex-1 py-2 px-3 bg-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lavender-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

// ── ComboForm ───────────────────────────────────────────────────────────────
export default function ComboForm({ selectedDate, onClose, onSave, initialData = null }) {
  const isEditing = !!initialData;
  const [step, setStep] = useState(1);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [clienteNome, setClienteNome] = useState(initialData?.[0]?.cliente_nome || '');
  const [clienteTelefone, setClienteTelefone] = useState(initialData?.[0]?.cliente_telefone || '');

  const newItem = () => ({ profissional_id: '', servico_id: '', servico: '', data_hora: '', data_hora_fim: '', valor: '' });

  // Converte initialData (agendamentos do banco) para o formato dos items
  const itemsFromData = (data) => data.map(a => ({
    id: a.id,
    profissional_id: a.profissional_id || '',
    servico_id: a.servico_id || '',
    servico: a.servico || '',
    data_hora: a.data_hora || '',
    data_hora_fim: '',
    valor: a.valor_cobrado != null ? String(a.valor_cobrado) : '',
  }));

  const [items, setItems] = useState(initialData ? itemsFromData(initialData) : [newItem()]);

  useEffect(() => {
    Promise.all([
      supabase.from('servicos').select('*').order('descricao'),
      supabase.from('profissionais').select('id, nome').order('nome'),
    ]).then(([s, p]) => {
      setServices(s.data || []);
      setProfessionals(p.data || []);
      setDataLoading(false);
    });
  }, []);

  const update = (i, val) => setItems(prev => prev.map((it, idx) => idx === i ? val : it));
  const remove = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const allComplete = items.every(it =>
    it.profissional_id && it.servico_id && it.data_hora && it.valor
  );

  const total = items.reduce((s, it) => {
    const v = parseFloat(String(it.valor).replace(',', '.'));
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  const fmtPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  const handleSave = async () => {
    if (!clienteNome) { setError('Informe o nome da cliente.'); return; }
    setSaving(true);
    setError('');

    if (isEditing) {
      // UPDATE: atualiza cada agendamento existente pelo id
      const updates = items.map(it =>
        supabase.from('agendamentos').update({
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          profissional_id: it.profissional_id,
          servico_id: it.servico_id,
          servico: it.servico,
          data_hora: it.data_hora,
          valor_cobrado: parseFloat(String(it.valor).replace(',', '.')),
          observacoes: it.data_hora_fim
            ? `Período: ${format(parseISO(it.data_hora), 'HH:mm')} → ${format(parseISO(it.data_hora_fim), 'HH:mm')}`
            : '',
        }).eq('id', it.id)
      );
      const results = await Promise.all(updates);
      const err = results.find(r => r.error)?.error;
      if (err) { setError('Erro ao salvar. Tente novamente.'); setSaving(false); return; }
    } else {
      // INSERT: cria novos agendamentos com combo_id
      const comboId = crypto.randomUUID();
      const { error: err } = await supabase.from('agendamentos').insert(
        items.map(it => ({
          combo_id: comboId,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          profissional_id: it.profissional_id,
          servico_id: it.servico_id,
          servico: it.servico,
          data_hora: it.data_hora,
          valor_cobrado: parseFloat(String(it.valor).replace(',', '.')),
          observacoes: it.data_hora_fim
            ? `Período: ${format(parseISO(it.data_hora), 'HH:mm')} → ${format(parseISO(it.data_hora_fim), 'HH:mm')}`
            : '',
        }))
      );
      if (err) { setError('Erro ao salvar. Tente novamente.'); setSaving(false); return; }
    }

    setSuccess(true);
    setTimeout(() => onSave(), 1600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-md">
      <Motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-white w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden"
      >
        {/* Sucesso */}
        {success && (
          <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-3">
            <Motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </Motion.div>
            <p className="font-black text-gray-900 text-lg">{isEditing ? 'Combo atualizado!' : 'Combo confirmado!'}</p>
            <p className="text-sm text-gray-400">{items.length} serviços para {clienteNome}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-lavender-500" />
            <span className="font-black text-gray-900">{isEditing ? 'Editar Combo' : 'Combo'}</span>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {format(initialData ? parseISO(initialData[0].data_hora) : selectedDate, "dd/MM", { locale: ptBR })}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
          {dataLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {items.map((item, i) => (
                    <ItemCard key={i} index={i} item={item}
                      professionals={professionals} services={services}
                      selectedDate={selectedDate}
                      onChange={val => update(i, val)}
                      onRemove={() => remove(i)}
                      canRemove={items.length > 1}
                    />
                  ))}

                  <button onClick={() => setItems(p => [...p, newItem()])}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-lavender-200 text-lavender-500 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-lavender-50 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Adicionar serviço
                  </button>

                  <div className="flex items-center justify-between bg-lavender-600 text-white rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total</p>
                      <p className="text-xl font-black">{formatBRL(total)}</p>
                    </div>
                    <button onClick={() => setStep(2)} disabled={!allComplete}
                      className="flex items-center gap-1.5 bg-white text-lavender-600 px-4 py-2 rounded-xl font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-lavender-50 transition-all active:scale-95">
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </Motion.div>
              )}

              {step === 2 && (
                <Motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {/* Resumo */}
                  <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5">
                    {items.map((it, i) => {
                      const p = professionals.find(x => x.id === it.profissional_id);
                      const v = parseFloat(String(it.valor).replace(',', '.'));
                      const s = format(parseISO(it.data_hora), 'HH:mm');
                      const e = it.data_hora_fim ? format(parseISO(it.data_hora_fim), 'HH:mm') : '';
                      return (
                        <div key={i} className="flex items-center justify-between text-xs gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-gray-700">{it.servico}</span>
                            <span className="text-gray-400"> · {p?.nome.split(' ')[0]}</span>
                            <span className="text-gray-400"> · {s}{e ? ` → ${e}` : ''}</span>
                          </div>
                          <span className="font-black text-lavender-600 flex-shrink-0">{formatBRL(isNaN(v) ? 0 : v)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs font-black">
                      <span>Total</span><span className="text-lavender-600">{formatBRL(total)}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Nome da cliente *"
                      value={clienteNome} onChange={e => setClienteNome(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-lavender-400" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="tel" placeholder="WhatsApp (opcional)"
                      value={clienteTelefone} onChange={e => setClienteTelefone(fmtPhone(e.target.value))}
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-lavender-400" />
                  </div>

                  {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)}
                      className="flex-shrink-0 px-4 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all">
                      ←
                    </button>
                    <button onClick={handleSave} disabled={saving || !clienteNome}
                      className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                      {saving
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Check className="w-4 h-4" /> {isEditing ? 'Salvar Alterações' : 'Confirmar Combo'}</>}
                    </button>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Motion.div>
    </div>
  );
}
