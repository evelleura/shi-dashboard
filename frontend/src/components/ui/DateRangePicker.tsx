import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function isoToDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

function formatDisplay(start: string, end: string): string {
  if (!start && !end) return 'Semua Waktu';
  const fmt = (s: string) => {
    const d = isoToDate(s);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  if (start) return `Dari ${fmt(start)}`;
  return `Hingga ${fmt(end)}`;
}

function todayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}

function subDays(iso: string, days: number) {
  const d = isoToDate(iso);
  d.setDate(d.getDate() - days);
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSame(a: string, b: string) { return a === b; }
function isBetween(d: string, start: string, end: string) { return d >= start && d <= end; }

type Preset = { label: string; days: number | null };
const PRESETS: Preset[] = [
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: '3 Bulan', days: 90 },
  { label: '6 Bulan', days: 180 },
  { label: 'Tahun Ini', days: -1 },
  { label: 'Semua', days: null },
];

function presetRange(p: Preset): [string, string] {
  if (p.days === null) return ['', ''];
  const today = todayISO();
  if (p.days === -1) {
    const y = new Date().getFullYear();
    return [`${y}-01-01`, today];
  }
  return [subDays(today, p.days), today];
}

function activePreset(start: string, end: string): string | null {
  for (const p of PRESETS) {
    const [s, e] = presetRange(p);
    if (s === start && e === end) return p.label;
  }
  return null;
}

// ── calendar grid helpers ──────────────────────────────────────────────────────

const DAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // shift to Mon start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// ── component ──────────────────────────────────────────────────────────────────

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => startDate ? isoToDate(startDate).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => startDate ? isoToDate(startDate).getMonth() : new Date().getMonth());

  // range selection state: first click sets rangeStart, second click finalizes
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleEsc); };
  }, [open]);

  // sync view month when props change externally
  useEffect(() => {
    if (startDate) {
      const d = isoToDate(startDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [startDate]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 0) { setViewYear((y) => y - 1); return 11; } return m - 1; });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 11) { setViewYear((y) => y + 1); return 0; } return m + 1; });
  }, []);

  const handleDayClick = useCallback((iso: string) => {
    if (!rangeStart) {
      // first click
      setRangeStart(iso);
      setHoverDate(null);
    } else {
      // second click — finalize range
      const [s, e] = iso >= rangeStart ? [rangeStart, iso] : [iso, rangeStart];
      onChange(s, e);
      setRangeStart(null);
      setHoverDate(null);
      setOpen(false);
    }
  }, [rangeStart, onChange]);

  const handlePreset = useCallback((p: Preset) => {
    const [s, e] = presetRange(p);
    onChange(s, e);
    setRangeStart(null);
    setHoverDate(null);
    if (s) {
      const d = isoToDate(s);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setOpen(false);
  }, [onChange]);

  // determine highlight range for rendering
  const hlStart = rangeStart
    ? (hoverDate ? (hoverDate >= rangeStart ? rangeStart : hoverDate) : rangeStart)
    : startDate;
  const hlEnd = rangeStart
    ? (hoverDate ? (hoverDate >= rangeStart ? hoverDate : rangeStart) : rangeStart)
    : endDate;

  const days = getCalendarDays(viewYear, viewMonth);
  const currentPreset = activePreset(startDate, endDate);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          open
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-200'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {/* calendar icon */}
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="whitespace-nowrap">{formatDisplay(startDate, endDate)}</span>
        {/* chevron */}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Left: presets */}
          <div className="border-r border-gray-100 dark:border-gray-700 py-2 px-1.5 flex flex-col gap-0.5 min-w-[100px]">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider px-2 pb-1">Preset</p>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePreset(p)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  currentPreset === p.label
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Right: calendar */}
          <div className="p-3 select-none" style={{ width: 280 }}>
            {/* Month/Year nav */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" aria-label="Bulan sebelumnya">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {MONTHS_ID[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" aria-label="Bulan berikutnya">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_ID.map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;

                const iso = toISO(viewYear, viewMonth, day);
                const isToday = iso === todayISO();
                const isStart = hlStart && isSame(iso, hlStart);
                const isEnd = hlEnd && isSame(iso, hlEnd);
                const inRange = hlStart && hlEnd && isBetween(iso, hlStart, hlEnd);
                const isRangeStart = rangeStart && isSame(iso, rangeStart);

                let cellBg = '';
                let textClass = 'text-gray-700 dark:text-gray-300';
                let roundClass = '';

                if (isStart || isEnd) {
                  cellBg = 'bg-blue-600';
                  textClass = 'text-white font-semibold';
                  if (isStart && isEnd) roundClass = 'rounded-lg';
                  else if (isStart) roundClass = 'rounded-l-lg';
                  else roundClass = 'rounded-r-lg';
                } else if (inRange) {
                  cellBg = 'bg-blue-50 dark:bg-blue-900/30';
                  textClass = 'text-blue-700 dark:text-blue-400';
                } else if (isRangeStart) {
                  cellBg = 'bg-blue-600';
                  textClass = 'text-white font-semibold';
                  roundClass = 'rounded-lg';
                }

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => handleDayClick(iso)}
                    onMouseEnter={() => rangeStart && setHoverDate(iso)}
                    className={`h-8 text-xs transition-colors relative ${cellBg} ${textClass} ${roundClass} hover:bg-blue-100 hover:text-blue-800 ${
                      isToday && !isStart && !isEnd && !isRangeStart ? 'font-bold underline underline-offset-2' : ''
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Selection hint */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
              {rangeStart ? (
                <p className="text-[10px] text-blue-600 font-medium">Pilih tanggal akhir...</p>
              ) : (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Klik tanggal untuk pilih rentang</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
