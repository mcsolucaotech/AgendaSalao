import { useState, useRef, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isSameMonth,
  isWithinInterval, startOfWeek, endOfWeek, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const PRESETS = [
  { label: 'Hoje',    days: 0  },
  { label: '7d',      days: 6  },
  { label: '15d',     days: 14 },
  { label: '30d',     days: 29 },
];

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen]         = useState(false);
  const [hovered, setHovered]   = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const ref = useRef(null);

  const start = value?.start ? parseISO(value.start) : null;
  const end   = value?.end   ? parseISO(value.end)   : null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSelecting(null);
        setHovered(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyPreset = (days) => {
    const today = new Date();
    const s = new Date(today);
    s.setDate(today.getDate() - days);
    onChange({ start: format(s, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') });
    setSelecting(null);
    setHovered(null);
    setOpen(false);
  };

  // calendar grid
  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const gridEnd   = endOfWeek(endOfMonth(viewMonth),     { weekStartsOn: 0 });
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const effectiveEnd = selecting ? (hovered || selecting) : end;

  const isInRange = (day) => {
    const s = selecting || start;
    const e = effectiveEnd;
    if (!s || !e) return false;
    const [a, b] = s <= e ? [s, e] : [e, s];
    return isWithinInterval(day, { start: a, end: b });
  };

  const isEdge = (day, edge) => {
    const s = selecting || start;
    const e = effectiveEnd;
    if (!s) return false;
    const [a, b] = s <= (e || s) ? [s, e || s] : [e || s, s];
    return edge === 'start' ? isSameDay(day, a) : (e ? isSameDay(day, b) : false);
  };

  const handleDayClick = (day) => {
    if (!selecting) {
      setSelecting(day);
      setHovered(day);
    } else {
      const [a, b] = selecting <= day ? [selecting, day] : [day, selecting];
      onChange({ start: format(a, 'yyyy-MM-dd'), end: format(b, 'yyyy-MM-dd') });
      setSelecting(null);
      setHovered(null);
      setOpen(false);
    }
  };

  const fmtShort = (d) => d ? format(d, 'dd/MM') : '—';
  const rangeLabel = start && end
    ? `${fmtShort(start)} → ${fmtShort(end)}`
    : 'Selecionar período';

  return (
    <div ref={ref} className="relative w-full">

      {/* ── Trigger ── */}
      <button
        onClick={() => { setOpen(o => !o); setSelecting(null); setHovered(null); }}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-lavender-200 hover:border-lavender-500 active:scale-[.98] rounded-2xl transition-all"
      >
        <CalendarDays className="w-4 h-4 text-lavender-500 flex-shrink-0" />
        <span className="flex-1 text-left text-xs font-bold text-gray-700 truncate">{rangeLabel}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-lavender-400 flex-shrink-0">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute z-[60] mt-2 left-1/2 -translate-x-1/2 w-[min(320px,95vw)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >

            {/* presets */}
            <div className="flex gap-1.5 p-3 border-b border-gray-50">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.days)}
                  className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-lavender-50 text-lavender-600 hover:bg-lavender-600 hover:text-white transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* month nav */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <button
                onClick={() => setViewMonth(m => subMonths(m, 1))}
                className="w-7 h-7 rounded-xl bg-gray-50 hover:bg-lavender-50 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <span className="text-xs font-black text-gray-800 capitalize">
                {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button
                onClick={() => setViewMonth(m => addMonths(m, 1))}
                className="w-7 h-7 rounded-xl bg-gray-50 hover:bg-lavender-50 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            {/* week headers */}
            <div className="grid grid-cols-7 px-3 pb-0.5">
              {WEEK_DAYS.map((d, i) => (
                <div key={i} className="text-center text-[9px] font-black uppercase text-gray-300 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* days */}
            <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
              {days.map((day, i) => {
                const inRange    = isInRange(day);
                const isStart    = isEdge(day, 'start');
                const isEnd      = isEdge(day, 'end');
                const isToday    = isSameDay(day, new Date());
                const inMonth    = isSameMonth(day, viewMonth);
                const isSingle   = isStart && isEnd;

                return (
                  <div
                    key={i}
                    className={[
                      'relative flex items-center justify-center h-8',
                      inRange && !isStart && !isEnd ? 'bg-lavender-50' : '',
                      isStart && !isSingle        ? 'rounded-l-full bg-lavender-50' : '',
                      isEnd   && !isSingle        ? 'rounded-r-full bg-lavender-50' : '',
                    ].join(' ')}
                  >
                    <button
                      onClick={() => inMonth && handleDayClick(day)}
                      onMouseEnter={() => selecting && inMonth && setHovered(day)}
                      disabled={!inMonth}
                      className={[
                        'w-7 h-7 rounded-full text-[11px] font-bold transition-all select-none',
                        !inMonth ? 'text-gray-200 cursor-default' : 'cursor-pointer',
                        isStart || isEnd
                          ? 'bg-lavender-600 text-white shadow-md shadow-lavender-200'
                          : '',
                        inRange && !isStart && !isEnd && inMonth ? 'text-lavender-700' : '',
                        isToday && !isStart && !isEnd ? 'ring-2 ring-lavender-300' : '',
                        inMonth && !isStart && !isEnd ? 'hover:bg-lavender-100' : '',
                      ].join(' ')}
                    >
                      {format(day, 'd')}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* hint */}
            <p className="text-center text-[10px] text-gray-300 font-medium pb-3">
              {selecting ? 'Toque no dia final' : 'Toque no dia inicial'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
