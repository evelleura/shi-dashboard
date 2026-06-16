// Indikator RAG kesehatan proyek dengan titik berwarna.
import type { StatusKesehatan } from '@/lib/health';

const KONFIG: Record<StatusKesehatan, { bg: string; text: string; dot: string; label: string }> = {
  green: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Tepat Waktu' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Waspada' },
  red:   { bg: 'bg-red-100',   text: 'text-red-800',   dot: 'bg-red-500',   label: 'Kritis' },
};

export function HealthBadge({ status }: { status: StatusKesehatan | null | undefined }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Belum Ada Data
      </span>
    );
  }
  const k = KONFIG[status];
  return (
    <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ' + k.bg + ' ' + k.text}>
      <span className={'h-1.5 w-1.5 rounded-full ' + k.dot} />
      {k.label}
    </span>
  );
}
