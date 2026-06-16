// Badge status dengan titik berwarna (gaya sebelum disederhanakan).
const KONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  // Status tugas
  to_do:       { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-400',  label: 'Belum Mulai' },
  working_on:  { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500',  label: 'Dikerjakan' },
  done:        { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  label: 'Selesai' },
  // Status proyek / fase
  active:      { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500',   label: 'Aktif' },
  completed:   { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  label: 'Selesai' },
  on_hold:     { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-400',  label: 'Ditahan' },
  survey:      { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500', label: 'Survei' },
  execution:   { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Eksekusi' },
  // Status eskalasi
  open:        { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500',    label: 'Terbuka' },
  ditangani:   { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500',  label: 'Ditangani' },
  closed:      { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400',  label: 'Selesai' },
};

export function StatusBadge({ status }: { status: string }) {
  const k = KONFIG[status] ?? { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: status };
  return (
    <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ' + k.bg + ' ' + k.text}>
      <span className={'h-1.5 w-1.5 rounded-full ' + k.dot} />
      {k.label}
    </span>
  );
}
