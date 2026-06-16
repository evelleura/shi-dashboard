// Dashboard - Early Warning System (Gambar 4.20).
// 4 kartu status + tabel proyek + panel eskalasi terbaru.
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { query } from '@/lib/db';
import type { StatusKesehatan } from '@/lib/health';
import { TabelEWS, TabelTugasMendatang } from './tabel-client';

interface BarisEWS {
  id_proyek: string;
  nama_proyek: string;
  end_date: string;
  nama_klien: string | null;
  spi_value: number | null;
  rag: StatusKesehatan | null;
  actual_progress: number | null;
  planned_progress: number | null;
  completed_tasks: number | null;
  total_tasks: number | null;
  updated_at: string | null;
}

interface BarisRingkas {
  total: number;
  merah: number;
  kuning: number;
  hijau: number;
}

interface BarisEskalasi {
  id_eskalasi: number;
  title: string;
  nama_pelapor: string;
  nama_proyek: string;
  created_at: string;
}

export default async function HalamanDasbor() {
  return (
    <Shell judul="Dashboard — Early Warning System (EWS)">
      {async (u) => {
        if (u.role === 'manager') {
          const ringkas = (await query<BarisRingkas>(`
            SELECT
              COUNT(*) FILTER (WHERE p.status = 'active')::int                         AS total,
              COUNT(*) FILTER (WHERE ph.status = 'red'   AND p.status='active')::int   AS merah,
              COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status='active')::int   AS kuning,
              COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status='active')::int   AS hijau
            FROM tb_proyek p
            LEFT JOIN project_health ph ON ph.project_id = p.id_proyek`)).rows[0];

          const proyek = (await query<BarisEWS>(`
            SELECT p.id_proyek::text AS id_proyek, p.nama_proyek, p.end_date, c.nama_klien,
                   ph.spi_value, ph.status AS rag,
                   ph.actual_progress, ph.planned_progress,
                   ph.completed_tasks, ph.total_tasks,
                   ph.last_updated::text AS updated_at
              FROM tb_proyek p
              LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
              LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
             WHERE p.status = 'active'
             ORDER BY
               CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
               ph.spi_value ASC NULLS LAST,
               p.end_date ASC`)).rows;

          const eskalasi = (await query<BarisEskalasi>(`
            SELECT e.id_eskalasi, e.title, e.created_at::text AS created_at,
                   p.nama_proyek, us.nama AS nama_pelapor
              FROM tb_eskalasi e
              JOIN tb_tugas t   ON t.id_tugas   = e.id_tugas
              JOIN tb_proyek p  ON p.id_proyek  = t.id_proyek
              JOIN tb_user us   ON us.id_user   = e.id_user
             WHERE e.status <> 'closed'
             ORDER BY e.created_at DESC
             LIMIT 5`)).rows;

          return (
            <div className="space-y-6">
              {/* 4 kartu status di urutan PDF: Total, Merah, Kuning, Hijau */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <KartuStatus label="Total Proyek"  value={ringkas.total}  badge={null} />
                <KartuStatus label="Status Merah"  value={ringkas.merah}  badge="x" tone="red" />
                <KartuStatus label="Status Kuning" value={ringkas.kuning} badge="!" tone="amber" />
                <KartuStatus label="Status Hijau"  value={ringkas.hijau}  badge="✓" tone="green" />
              </div>

              {/* Tabel daftar proyek */}
              <section className="space-y-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Daftar Proyek</h2>
                  <p className="text-xs text-slate-500">Diurutkan berdasarkan status paling kritis.</p>
                </div>
                <TabelEWS proyek={proyek.map((p) => ({
                  ...p,
                  spi_value: p.spi_value === null ? null : Number(p.spi_value),
                  actual_progress: p.actual_progress === null ? null : Number(p.actual_progress),
                  planned_progress: p.planned_progress === null ? null : Number(p.planned_progress),
                  end_date: p.end_date.toString().slice(0, 10),
                }))} />
              </section>

              {/* Panel eskalasi terbaru */}
              <section className="rounded-md border border-slate-200 bg-white shadow-sm">
                <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <h2 className="text-sm font-bold text-slate-900">Eskalasi Terbaru (membutuhkan tindakan)</h2>
                  <Link href="/escalations" className="text-xs font-semibold text-blue-600 hover:underline">
                    Lihat semua →
                  </Link>
                </header>
                {eskalasi.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">Tidak ada eskalasi aktif.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {eskalasi.map((e) => (
                      <li key={e.id_eskalasi} className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-slate-900">{e.nama_pelapor}</span>
                          <span className="mx-2 text-slate-400">·</span>
                          <span className="text-slate-700">{e.nama_proyek}</span>
                          <span className="mx-2 text-slate-400">—</span>
                          <span className="text-slate-600">{e.title}</span>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">
                          {new Date(e.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          );
        }

        // ── Teknisi: Dashboard Performa Saya (Gambar 4.23) ─────────────────
        const ringkas = (await query<{ total_tugas: number; selesai: number; dikerjakan: number; belum_mulai: number; terlambat: number }>(
          `SELECT
              COUNT(*)::int                                                  AS total_tugas,
              COUNT(*) FILTER (WHERE status='done')::int                     AS selesai,
              COUNT(*) FILTER (WHERE status='working_on')::int               AS dikerjakan,
              COUNT(*) FILTER (WHERE status='to_do')::int                    AS belum_mulai,
              COUNT(*) FILTER (WHERE due_date<CURRENT_DATE AND status<>'done')::int AS terlambat
           FROM tb_tugas WHERE id_user = $1`,
          [u.id],
        )).rows[0];

        const spiSaya = (await query<{ spi: string | null }>(
          `SELECT AVG(ph.spi_value)::text AS spi
             FROM project_health ph
             JOIN tb_penugasan_proyek pp ON pp.id_proyek = ph.project_id
            WHERE pp.id_user = $1`,
          [u.id],
        )).rows[0];

        const tugas = (await query<{ id_tugas: number; nama_tugas: string; status: string; due_date: string | null; nama_proyek: string }>(
          `SELECT t.id_tugas, t.nama_tugas, t.status, t.due_date, p.nama_proyek
             FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek = t.id_proyek
            WHERE t.id_user = $1
            ORDER BY t.due_date NULLS LAST`,
          [u.id],
        )).rows;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <KartuStatus
                label="SPI Saya"
                value={spiSaya.spi ? Number(spiSaya.spi).toFixed(2) : '—'}
                badge={null}
              />
              <KartuStatus label="Tugas Selesai"  value={ringkas.selesai}     badge="✓" tone="green" />
              <KartuStatus label="Tugas Berjalan" value={ringkas.dikerjakan}  badge="…" tone="amber" />
              <KartuStatus label="Tugas Overdue"  value={ringkas.terlambat}   badge="!" tone="red" />
            </div>
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">Tugas Saat Ini</h2>
              <TabelTugasMendatang tugas={tugas} />
            </section>
          </div>
        );
      }}
    </Shell>
  );
}

function KartuStatus({
  label, value, badge, tone,
}: {
  label: string;
  value: number | string;
  badge: string | null;
  tone?: 'red' | 'amber' | 'green';
}) {
  const tonecls = {
    red:   { bg: 'bg-red-100',   text: 'text-red-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
  } as const;
  const b = tone ? tonecls[tone] : { bg: 'bg-slate-100', text: 'text-slate-700' };
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        {badge && (
          <span className={'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ' + b.bg + ' ' + b.text}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}
