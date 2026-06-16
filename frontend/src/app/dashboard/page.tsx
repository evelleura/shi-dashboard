// Dasbor (Gambar 5.25 untuk manajer / 5.29 untuk teknisi).
// Server Component — kueri langsung via lib/db.
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { HealthBadge } from '@/components/HealthBadge';
import { query } from '@/lib/db';
import type { StatusKesehatan } from '@/lib/health';

interface BarisEWS {
  id_proyek: number;
  nama_proyek: string;
  end_date: string;
  nama_klien: string | null;
  spi_value: number | null;
  rag: StatusKesehatan | null;
  completed_tasks: number | null;
  total_tasks: number | null;
  overdue_tasks: number | null;
  actual_progress: number | null;
  planned_progress: number | null;
}

interface BarisRingkas {
  proyek_aktif: number;
  kritis: number;
  waspada: number;
  tepat_waktu: number;
  tanpa_data: number;
  rata_rata_spi: string | null;
}

export default async function HalamanDasbor() {
  return (
    <Shell judul="Dasbor">
      {async (u) => {
        if (u.role === 'manager') {
          const ringkas = (await query<BarisRingkas>(`
            SELECT
              COUNT(*) FILTER (WHERE p.status = 'active')::int                                   AS proyek_aktif,
              COUNT(*) FILTER (WHERE ph.status = 'red'   AND p.status = 'active')::int           AS kritis,
              COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status = 'active')::int           AS waspada,
              COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status = 'active')::int           AS tepat_waktu,
              COUNT(*) FILTER (WHERE ph.status IS NULL   AND p.status = 'active')::int           AS tanpa_data,
              COALESCE(ROUND(AVG(ph.spi_value) FILTER (WHERE p.status='active'), 4)::text, '0') AS rata_rata_spi
            FROM tb_proyek p
            LEFT JOIN project_health ph ON ph.project_id = p.id_proyek`)).rows[0];
          const proyek = (await query<BarisEWS>(`
            SELECT p.id_proyek, p.nama_proyek, p.end_date, c.nama_klien,
                   ph.spi_value, ph.status AS rag,
                   ph.completed_tasks, ph.total_tasks, ph.overdue_tasks,
                   ph.actual_progress, ph.planned_progress
              FROM tb_proyek p
              LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
              LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
             WHERE p.status = 'active'
             ORDER BY
               CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
               ph.spi_value ASC NULLS LAST,
               p.end_date ASC`)).rows;
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Link href="/projects/new" className="btn-primary">+ Proyek Baru</Link>
                <Link href="/projects" className="btn-outline">Lihat Semua Proyek</Link>
                <Link href="/escalations" className="btn-outline">Eskalasi</Link>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <Tile label="Proyek Aktif" value={ringkas.proyek_aktif} />
                <Tile label="Kritis"       value={ringkas.kritis} tone="red" />
                <Tile label="Waspada"      value={ringkas.waspada} tone="amber" />
                <Tile label="Tepat Waktu"  value={ringkas.tepat_waktu} tone="green" />
                <Tile label="Rata-rata SPI" value={Number(ringkas.rata_rata_spi).toFixed(3)} />
              </div>

              <div className="card">
                <h2 className="mb-3 text-base font-semibold">Daftar Proyek Aktif (Dasbor EWS)</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Diurutkan berdasarkan kekritisan: Merah → Kuning → Hijau. Dalam tiap kategori,
                  proyek dengan SPI terkecil dan tenggat terdekat muncul lebih dahulu.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-2">Proyek</th>
                        <th>Klien</th>
                        <th>Kesehatan</th>
                        <th>SPI</th>
                        <th>Tugas (Selesai/Total)</th>
                        <th>Tenggat</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {proyek.map((p) => (
                        <tr key={p.id_proyek} className="border-t">
                          <td className="py-2 font-medium">{p.nama_proyek}</td>
                          <td className="text-slate-600">{p.nama_klien ?? '-'}</td>
                          <td><HealthBadge status={p.rag} /></td>
                          <td>{p.spi_value !== null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                          <td>{p.completed_tasks ?? 0} / {p.total_tasks ?? 0}</td>
                          <td>{p.end_date.toString().slice(0, 10)}</td>
                          <td>
                            <Link href={`/projects/${p.id_proyek}`} className="text-sm text-blue-600 hover:underline">
                              Detail
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {proyek.length === 0 && (
                        <tr><td colSpan={7} className="py-6 text-center text-slate-500">Belum ada proyek aktif.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }

        // -------- Teknisi --------
        const ringkas = (await query<{ total_tugas: number; selesai: number; dikerjakan: number; belum_mulai: number; terlambat: number }>(
          `SELECT
              COUNT(*)::int                                                 AS total_tugas,
              COUNT(*) FILTER (WHERE status = 'done')::int                  AS selesai,
              COUNT(*) FILTER (WHERE status = 'working_on')::int            AS dikerjakan,
              COUNT(*) FILTER (WHERE status = 'to_do')::int                 AS belum_mulai,
              COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status <> 'done')::int AS terlambat
           FROM tb_tugas WHERE id_user = $1`,
          [u.id],
        )).rows[0];
        const tugas = (await query<{ id_tugas: number; nama_tugas: string; status: string; due_date: string | null; nama_proyek: string }>(
          `SELECT t.id_tugas, t.nama_tugas, t.status, t.due_date, p.nama_proyek
             FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek = t.id_proyek
            WHERE t.id_user = $1
            ORDER BY t.due_date NULLS LAST LIMIT 20`,
          [u.id],
        )).rows;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <Tile label="Total Tugas"  value={ringkas.total_tugas} />
              <Tile label="Selesai"      value={ringkas.selesai} tone="green" />
              <Tile label="Dikerjakan"   value={ringkas.dikerjakan} tone="amber" />
              <Tile label="Belum Mulai"  value={ringkas.belum_mulai} />
              <Tile label="Terlambat"    value={ringkas.terlambat} tone="red" />
            </div>
            <div className="card">
              <h2 className="mb-3 text-base font-semibold">Tugas Mendatang</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr><th className="py-2">Nama Tugas</th><th>Proyek</th><th>Tenggat</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {tugas.map((t) => (
                    <tr key={t.id_tugas} className="border-t">
                      <td className="py-2">{t.nama_tugas}</td>
                      <td className="text-slate-600">{t.nama_proyek}</td>
                      <td>{t.due_date ? t.due_date.slice(0, 10) : '-'}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {tugas.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-500">Belum ada tugas ditugaskan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </Shell>
  );
}

function Tile({ label, value, tone }: { label: string; value: number | string; tone?: 'red' | 'amber' | 'green' }) {
  const ring = tone === 'red' ? 'text-red-600'
    : tone === 'amber' ? 'text-amber-600'
    : tone === 'green' ? 'text-green-600' : 'text-slate-900';
  return (
    <div className="card text-center">
      <div className={'text-2xl font-bold ' + ring}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
