// Halaman Daftar Proyek (Gambar 5.26).
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { HealthBadge } from '@/components/HealthBadge';
import { query } from '@/lib/db';
import type { StatusKesehatan } from '@/lib/health';

interface Baris {
  id_proyek: number;
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

export default async function DaftarProyek() {
  return (
    <Shell judul="Proyek">
      {async (u) => {
        const sql = `
          SELECT p.id_proyek, p.nama_proyek, p.project_code, p.category,
                 p.phase, p.status, p.start_date, p.end_date,
                 c.nama_klien, ph.spi_value, ph.status AS health_status
            FROM tb_proyek p
            LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
            LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
           ${u.role === 'technician' ? `
             WHERE p.id_proyek IN (SELECT id_proyek FROM tb_penugasan_proyek WHERE id_user = $1)
           ` : ''}
           ORDER BY p.created_at DESC`;
        const params = u.role === 'technician' ? [u.id] : [];
        const proyek = (await query<Baris>(sql, params)).rows;
        return (
          <div className="space-y-4">
            {u.role === 'manager' && (
              <div className="flex justify-between">
                <p className="text-sm text-slate-600">
                  Klik baris untuk melihat detail proyek beserta papan Kanban tugas.
                </p>
                <Link href="/projects/new" className="btn-primary">+ Proyek Baru</Link>
              </div>
            )}
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Kode</th>
                    <th>Nama Proyek</th>
                    <th>Klien</th>
                    <th>Kategori</th>
                    <th>Fase</th>
                    <th>Status</th>
                    <th>Kesehatan</th>
                    <th>SPI</th>
                    <th>Tenggat</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {proyek.map((p) => (
                    <tr key={p.id_proyek} className="border-t">
                      <td className="py-2 font-mono text-xs">{p.project_code ?? '-'}</td>
                      <td className="font-medium">{p.nama_proyek}</td>
                      <td className="text-slate-600">{p.nama_klien ?? '-'}</td>
                      <td>{p.category ?? '-'}</td>
                      <td><StatusBadge status={p.phase} /></td>
                      <td><StatusBadge status={p.status} /></td>
                      <td><HealthBadge status={p.health_status} /></td>
                      <td>{p.spi_value !== null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                      <td>{p.end_date.toString().slice(0, 10)}</td>
                      <td>
                        <Link href={`/projects/${p.id_proyek}`} className="text-sm text-blue-600 hover:underline">
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {proyek.length === 0 && (
                    <tr><td colSpan={10} className="py-6 text-center text-slate-500">Belum ada proyek.</td></tr>
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
