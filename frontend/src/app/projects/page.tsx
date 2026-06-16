// Halaman Daftar Proyek (Gambar 5.26) — DataTable dengan paginasi + sorting.
import { Shell } from '@/components/Shell';
import { query } from '@/lib/db';
import type { StatusKesehatan } from '@/lib/health';
import { TabelProyek } from './tabel-client';
import Link from 'next/link';

interface Baris {
  id_proyek: string;
  nama_proyek: string;
  project_code: string | null;
  category: string | null;
  phase: string;
  status: string;
  spi_value: string | null;
  health_status: StatusKesehatan | null;
  nama_klien: string | null;
  start_date: string;
  end_date: string;
}

export default async function DaftarProyek() {
  return (
    <Shell
      judul="Proyek"
      subjudul="Daftar seluruh proyek SHI beserta indikator kesehatan."
    >
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link href="/projects/new" className="btn-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Proyek Baru
                </Link>
              </div>
            )}
            <TabelProyek proyek={proyek.map((p) => ({
              ...p,
              spi_value: p.spi_value === null ? null : Number(p.spi_value),
              start_date: p.start_date.toString().slice(0, 10),
              end_date: p.end_date.toString().slice(0, 10),
            }))} />
          </div>
        );
      }}
    </Shell>
  );
}
