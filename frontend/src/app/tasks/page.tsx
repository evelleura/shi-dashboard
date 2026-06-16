// Halaman Tugas Teknisi (Gambar 5.31) — Kanban semua tugas milik teknisi.
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { query } from '@/lib/db';
import { AksiTugas } from './aksi-client';

interface Baris {
  id_tugas: number;
  nama_tugas: string;
  status: 'to_do' | 'working_on' | 'done';
  due_date: string | null;
  nama_proyek: string;
  id_proyek: number;
}

export default async function HalamanTugas() {
  return (
    <Shell judul="Tugas Saya">
      {async (u) => {
        if (u.role !== 'technician') redirect('/dashboard');
        const tugas = (await query<Baris>(
          `SELECT t.id_tugas, t.nama_tugas, t.status, t.due_date,
                  p.nama_proyek, p.id_proyek
             FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek = t.id_proyek
            WHERE t.id_user = $1
            ORDER BY t.due_date NULLS LAST`,
          [u.id],
        )).rows;

        const grup = {
          to_do: tugas.filter((t) => t.status === 'to_do'),
          working_on: tugas.filter((t) => t.status === 'working_on'),
          done: tugas.filter((t) => t.status === 'done'),
        };
        return (
          <div className="card">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Kolom judul="Belum Mulai" warna="bg-slate-50 border-slate-200" tugas={grup.to_do} aksi="mulai" />
              <Kolom judul="Dikerjakan" warna="bg-amber-50 border-amber-200" tugas={grup.working_on} aksi="info" />
              <Kolom judul="Selesai" warna="bg-green-50 border-green-200" tugas={grup.done} aksi="none" />
            </div>
            {tugas.length === 0 && (
              <p className="py-6 text-center text-slate-500">Belum ada tugas ditugaskan kepada Anda.</p>
            )}
          </div>
        );
      }}
    </Shell>
  );
}

function Kolom({
  judul, warna, tugas, aksi,
}: {
  judul: string; warna: string; tugas: Baris[]; aksi: 'mulai' | 'info' | 'none';
}) {
  return (
    <div className={'rounded-lg border p-3 ' + warna}>
      <div className="mb-2 text-sm font-semibold">{judul} ({tugas.length})</div>
      <div className="space-y-2">
        {tugas.map((t) => (
          <div key={t.id_tugas} className="rounded border bg-white p-3 shadow-sm">
            <div className="text-sm font-medium">{t.nama_tugas}</div>
            <div className="mt-1 text-xs text-slate-500">
              {t.nama_proyek} · {t.due_date ? `Tenggat ${t.due_date.toString().slice(0, 10)}` : 'tanpa tenggat'}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <StatusBadge status={t.status} />
              <AksiTugas idTugas={t.id_tugas} aksi={aksi} />
            </div>
          </div>
        ))}
        {tugas.length === 0 && <p className="text-xs text-slate-400">—</p>}
      </div>
    </div>
  );
}
