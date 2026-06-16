'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable, type Kolom } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { useRouter } from 'next/navigation';
import type { StatusKesehatan } from '@/lib/health';

interface Row {
  id_proyek: string;
  nama_proyek: string;
  project_code: string | null;
  category: string | null;
  phase: string;
  status: string;
  spi_value: number | null;
  health_status: StatusKesehatan | null;
  nama_klien: string | null;
  start_date: string;
  end_date: string;
}

export function TabelProyek({ proyek }: { proyek: Row[] }) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterKlien, setFilterKlien] = useState('');

  // Daftar klien unik untuk dropdown
  const klienOptions = useMemo(() => {
    const set = new Set<string>();
    proyek.forEach((p) => { if (p.nama_klien) set.add(p.nama_klien); });
    return Array.from(set).sort();
  }, [proyek]);

  const filtered = useMemo(() => proyek.filter((p) =>
    (!filterStatus || p.status === filterStatus) &&
    (!filterPhase  || p.phase  === filterPhase)  &&
    (!filterKlien  || p.nama_klien === filterKlien)
  ), [proyek, filterStatus, filterPhase, filterKlien]);

  const kolom: Kolom<Row>[] = [
    {
      key: 'project_code', label: 'ID', sortable: true, width: '110px',
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-700">{r.project_code ?? '-'}</span>,
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
      key: 'status', label: 'Status', sortable: true, width: '110px',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'phase', label: 'Phase', sortable: true, width: '110px',
      render: (r) => <StatusBadge status={r.phase} />,
    },
    {
      key: 'start_date', label: 'Mulai', sortable: true, width: '110px',
      render: (r) => <span className="text-sm text-slate-600">{r.start_date}</span>,
    },
    {
      key: 'end_date', label: 'Selesai', sortable: true, width: '110px',
      render: (r) => <span className="text-sm text-slate-600">{r.end_date}</span>,
    },
    {
      key: 'aksi', label: 'Aksi', align: 'right', width: '180px',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/projects/${r.id_proyek}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >Lihat</Link>
          <Link
            href={`/projects/${r.id_proyek}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-100"
          >Edit</Link>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm('Hapus proyek ini?')) return;
              await fetch(`/api/projects/${r.id_proyek}`, { method: 'DELETE' });
              router.refresh();
            }}
            className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-100"
          >Hapus</button>
        </div>
      ),
    },
  ];

  // Toolbar tambahan: 3 dropdown filter
  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Status: semua</option>
        <option value="active">Aktif</option>
        <option value="on_hold">Ditahan</option>
        <option value="completed">Selesai</option>
      </select>
      <select
        value={filterPhase}
        onChange={(e) => setFilterPhase(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Phase: semua</option>
        <option value="survey">Survei</option>
        <option value="execution">Eksekusi</option>
      </select>
      <select
        value={filterKlien}
        onChange={(e) => setFilterKlien(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Klien: semua</option>
        {klienOptions.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>
  );

  return (
    <DataTable
      kolom={kolom}
      data={filtered}
      rowKey={(r) => r.id_proyek}
      onRowClick={(r) => router.push(`/projects/${r.id_proyek}`)}
      emptyMessage="Belum ada proyek terdaftar."
      searchPlaceholder="Cari nama proyek…"
      toolbar={toolbar}
    />
  );
}
