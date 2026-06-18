'use client';

import { useState, type FormEvent } from 'react';
import { useDailyReports, useCreateDailyReport } from '../../hooks/useDailyReports';

interface DailyReportPanelProps {
  projectId: number;
  /** Teknisi yang ditugaskan (dan manajer) boleh menulis catatan. */
  canSubmit: boolean;
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return d;
  }
}

/**
 * Laporan Harian (Catatan Kendala) - naskah 4.2.2. TANPA persentase progres:
 * teknisi hanya mencatat kendala lapangan harian. EV/SPI tetap dihitung otomatis
 * dari status tugas (lihat spiCalculator), bukan dari input ini.
 */
export default function DailyReportPanel({ projectId, canSubmit }: DailyReportPanelProps) {
  const { data: reports = [], isLoading } = useDailyReports(projectId);
  const createReport = useCreateDailyReport();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await createReport.mutateAsync({ project_id: projectId, constraints: trimmed });
      setText('');
    } catch {
      setError('Gagal menyimpan catatan. Coba lagi.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Laporan Harian (Catatan Kendala)</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Catat kendala lapangan hari ini. Progres proyek dihitung otomatis dari status tugas - tidak perlu mengisi persentase.
        </p>
      </div>

      {canSubmit && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Tulis kendala hari ini (mis. material terlambat, cuaca, akses lokasi)..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!text.trim() || createReport.isPending}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createReport.isPending ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-gray-400">Memuat...</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada catatan kendala.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{r.created_by_name ?? 'Teknisi'}</span>
                <span className="text-xs text-gray-400">{formatDate(r.report_date)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.constraints}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
