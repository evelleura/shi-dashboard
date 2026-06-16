'use client';
import { DataTable, type Kolom } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { TombolTangani } from './form-client';

export interface Esk {
  id_eskalasi: number;
  id_tugas: number;
  nama_tugas: string;
  nama_proyek: string;
  nama_pelapor: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'ditangani' | 'closed';
  instruksi: string | null;
  created_at: string;
}

const LABEL_PRIORITAS: Record<string, { text: string; bg: string; dot: string }> = {
  low:    { text: 'Rendah', bg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  medium: { text: 'Sedang', bg: 'bg-blue-100  text-blue-700',  dot: 'bg-blue-500' },
  high:   { text: 'Tinggi', bg: 'bg-red-100   text-red-700',   dot: 'bg-red-500' },
};

const PRIO_ORDER: Record<string, number> = { high: 1, medium: 2, low: 3 };

export function TabelEskalasi({
  data, peran,
}: { data: Esk[]; peran: 'manager' | 'technician' }) {
  const kolom: Kolom<Esk>[] = [
    {
      key: 'title', label: 'Judul / Deskripsi', sortable: true,
      render: (e) => (
        <div className="min-w-[260px]">
          <div className="font-semibold text-slate-900">{e.title}</div>
          <p className="mt-0.5 text-xs leading-snug text-slate-600">{e.description}</p>
          {e.instruksi && (
            <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800">
              <strong>Instruksi manajer:</strong> {e.instruksi}
            </p>
          )}
        </div>
      ),
      filterValue: (e) => `${e.title} ${e.description} ${e.instruksi ?? ''}`,
    },
    {
      key: 'nama_tugas', label: 'Tugas / Proyek', sortable: true,
      render: (e) => (
        <div className="leading-tight">
          <div className="text-sm text-slate-700">{e.nama_tugas}</div>
          <div className="text-xs text-slate-500">{e.nama_proyek}</div>
        </div>
      ),
      filterValue: (e) => `${e.nama_tugas} ${e.nama_proyek}`,
    },
    {
      key: 'nama_pelapor', label: 'Pelapor', sortable: true, width: '140px',
    },
    {
      key: 'priority', label: 'Prioritas', sortable: true, width: '110px',
      render: (e) => {
        const p = LABEL_PRIORITAS[e.priority];
        return (
          <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ' + p.bg}>
            <span className={'h-1.5 w-1.5 rounded-full ' + p.dot} />
            {p.text}
          </span>
        );
      },
      sortValue: (e) => PRIO_ORDER[e.priority] ?? 99,
    },
    {
      key: 'status', label: 'Status', sortable: true, width: '120px',
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: 'created_at', label: 'Dibuat', sortable: true, width: '110px',
      render: (e) => (
        <span className="text-xs text-slate-500">
          {new Date(e.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
      sortValue: (e) => new Date(e.created_at).getTime(),
    },
    {
      key: 'aksi', label: '', align: 'right', width: '160px',
      render: (e) =>
        peran === 'manager' && e.status !== 'closed' ? (
          <TombolTangani idEskalasi={e.id_eskalasi} sudahDitangani={e.status === 'ditangani'} />
        ) : null,
    },
  ];
  return (
    <DataTable
      kolom={kolom}
      data={data}
      rowKey={(e) => e.id_eskalasi}
      emptyMessage="Belum ada eskalasi."
      searchPlaceholder="Cari judul, tugas, atau pelapor…"
      defaultSortKey="created_at"
      defaultSortDesc
    />
  );
}
