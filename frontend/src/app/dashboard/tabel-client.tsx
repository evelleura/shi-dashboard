'use client';
import Link from 'next/link';
import { DataTable, type Kolom } from '@/components/DataTable';
import { HealthBadge } from '@/components/HealthBadge';
import { StatusBadge } from '@/components/StatusBadge';
import type { StatusKesehatan } from '@/lib/health';

interface BarisProyek {
  id_proyek: string;
  nama_proyek: string;
  nama_klien: string | null;
  rag: StatusKesehatan | null;
  spi_value: number | null;
  actual_progress: number | null;
  planned_progress: number | null;
  completed_tasks: number | null;
  total_tasks: number | null;
  end_date: string;
  updated_at: string | null;
}

const RAG_ORDER: Record<string, number> = { red: 1, amber: 2, green: 3 };

export function TabelEWS({ proyek }: { proyek: BarisProyek[] }) {
  const kolom: Kolom<BarisProyek>[] = [
    {
      key: 'rag', label: 'Status', sortable: true, width: '140px',
      render: (r) => <HealthBadge status={r.rag} />,
      sortValue: (r) => RAG_ORDER[r.rag ?? ''] ?? 99,
    },
    {
      key: 'nama_proyek', label: 'Nama Proyek', sortable: true,
      render: (r) => (
        <Link href={`/projects/${r.id_proyek}`} className="font-semibold text-slate-900 hover:text-blue-600">
          {r.nama_proyek}
        </Link>
      ),
    },
    {
      key: 'nama_klien', label: 'Klien', sortable: true, width: '180px',
      render: (r) => <span className="text-sm text-slate-600">{r.nama_klien ?? '—'}</span>,
    },
    {
      key: 'spi_value', label: 'SPI', sortable: true, align: 'right', width: '80px',
      render: (r) => (
        <span className="font-mono text-sm tabular-nums">
          {r.spi_value !== null ? Number(r.spi_value).toFixed(2) : '—'}
        </span>
      ),
      sortValue: (r) => r.spi_value ?? -1,
    },
    {
      key: 'deviasi', label: 'Deviasi', sortable: true, align: 'right', width: '90px',
      render: (r) => {
        if (r.actual_progress == null || r.planned_progress == null) return <span className="text-slate-400">—</span>;
        const dev = Number(r.actual_progress) - Number(r.planned_progress);
        const color = dev >= 0 ? 'text-green-700' : 'text-red-700';
        const sign = dev >= 0 ? '+' : '';
        return <span className={'font-mono text-sm tabular-nums ' + color}>{sign}{dev.toFixed(0)}%</span>;
      },
      sortValue: (r) => (r.actual_progress == null || r.planned_progress == null)
        ? 0
        : Number(r.actual_progress) - Number(r.planned_progress),
    },
    {
      key: 'updated_at', label: 'Update Terakhir', sortable: true, width: '160px',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {r.updated_at
            ? new Date(r.updated_at).toLocaleString('id-ID', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })
            : '—'}
        </span>
      ),
      sortValue: (r) => r.updated_at ? new Date(r.updated_at).getTime() : 0,
    },
    {
      key: 'aksi', label: '', align: 'right', width: '90px',
      render: (r) => (
        <Link href={`/projects/${r.id_proyek}`} className="text-sm font-semibold text-blue-600 hover:underline">
          Lihat →
        </Link>
      ),
    },
  ];
  return (
    <DataTable
      kolom={kolom}
      data={proyek}
      rowKey={(r) => r.id_proyek}
      emptyMessage="Belum ada proyek aktif."
      searchPlaceholder="Cari proyek atau klien…"
      defaultSortKey="rag"
      defaultSortDesc={false}
    />
  );
}

interface BarisTugas {
  id_tugas: number;
  nama_tugas: string;
  status: string;
  due_date: string | null;
  nama_proyek: string;
}

export function TabelTugasMendatang({ tugas }: { tugas: BarisTugas[] }) {
  const kolom: Kolom<BarisTugas>[] = [
    { key: 'nama_tugas', label: 'Nama Tugas', sortable: true },
    { key: 'nama_proyek', label: 'Proyek', sortable: true },
    {
      key: 'due_date', label: 'Tenggat', sortable: true, width: '140px',
      render: (r) => <span className="text-sm text-slate-600">{r.due_date ? r.due_date.slice(0, 10) : '—'}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true, width: '150px',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];
  return (
    <DataTable
      kolom={kolom}
      data={tugas}
      rowKey={(r) => r.id_tugas}
      emptyMessage="Belum ada tugas ditugaskan kepada Anda."
      searchPlaceholder="Cari tugas atau proyek…"
    />
  );
}
