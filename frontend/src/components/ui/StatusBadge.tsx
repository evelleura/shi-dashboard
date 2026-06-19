import type { HealthStatus } from '../../types';

interface Props {
  status: HealthStatus | null;
  showLabel?: boolean;
  /**
   * Lifecycle status of the project (active|completed|on-hold|cancelled).
   * Kesehatan RAG (Baik/Waspada/Kritis) adalah sinyal EWS yang HANYA bermakna
   * untuk proyek AKTIF -- proyek selesai tidak pernah "Kritis" (tak ada yang
   * bisa ditindak). Untuk proyek non-aktif tampilkan pil siklus-hidup netral.
   * Konsisten dgn Dashboard yang menghitung RAG active-only. Hilangkan/biarkan
   * undefined hanya pada konteks yang memang sudah active-only.
   */
  projectStatus?: string | null;
}

const config: Record<HealthStatus, { bg: string; text: string; label: string; dot: string }> = {
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'Baik', dot: 'bg-green-500' },
  amber: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', label: 'Waspada', dot: 'bg-yellow-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', label: 'Kritis', dot: 'bg-red-500' },
};

// Pil siklus-hidup netral untuk proyek non-aktif (palet sama dgn badge Status
// proyek di ProjectsPage: slate=selesai, stone=ditunda, gray=dibatalkan).
const lifecycleConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  completed: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200', label: 'Selesai', dot: 'bg-slate-500' },
  'on-hold': { bg: 'bg-stone-200 dark:bg-stone-600/50', text: 'text-stone-700 dark:text-stone-200', label: 'Ditunda', dot: 'bg-stone-500' },
  cancelled: { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Dibatalkan', dot: 'bg-gray-400' },
};

export default function StatusBadge({ status, showLabel = true, projectStatus }: Props) {
  // Proyek non-aktif -> pil siklus-hidup netral, JANGAN RAG. Proyek selesai yang
  // dulu telat tetap punya SPI historis (ditampilkan terpisah), tapi tidak boleh
  // muncul sebagai "Kritis" di EWS.
  if (projectStatus && projectStatus !== 'active') {
    const lc = lifecycleConfig[projectStatus] ?? lifecycleConfig.completed;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${lc.bg} ${lc.text}`}>
        <span className={`w-2 h-2 rounded-full ${lc.dot}`} />
        {showLabel && lc.label}
      </span>
    );
  }

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        {showLabel && 'Belum Dinilai'}
      </span>
    );
  }

  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {showLabel && c.label}
    </span>
  );
}
