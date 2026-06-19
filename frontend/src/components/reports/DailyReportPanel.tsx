'use client';

import { useState, type FormEvent } from 'react';
import { useDailyReports, useCreateDailyReport, useDeleteDailyReport } from '../../hooks/useDailyReports';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../ui/ConfirmDialog';

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
  const { user } = useAuth();
  const canManage = user?.role === 'manajer' || user?.role === 'admin';
  const { data: reports = [], isLoading } = useDailyReports(projectId);
  const createReport = useCreateDailyReport();
  const deleteReport = useDeleteDailyReport(projectId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatDate(r.report_date)}</span>
                  {(canManage || r.created_by === user?.id) && (
                    <button
                      type="button"
                      onClick={() => setDeleteId(r.id)}
                      title="Hapus catatan"
                      aria-label="Hapus catatan"
                      className="text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.constraints}</p>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          await deleteReport.mutateAsync(deleteId!);
          setDeleteId(null);
        }}
        title="Hapus Catatan"
        message="Hapus catatan kendala harian ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteReport.isPending}
      />
    </div>
  );
}
