// Halaman Eskalasi — daftar via DataTable + (untuk teknisi) form pengajuan.
import { Shell } from '@/components/Shell';
import { query } from '@/lib/db';
import { FormEskalasi } from './form-client';
import { TabelEskalasi, type Esk } from './tabel-client';

export default async function HalamanEskalasi() {
  return (
    <Shell judul="Eskalasi" subjudul="Permintaan bantuan dari teknisi & instruksi manajer.">
      {async (u) => {
        const sql = `
          SELECT e.id_eskalasi, e.id_tugas, e.title, e.description, e.priority, e.status,
                 e.instruksi, e.created_at,
                 t.nama_tugas, p.nama_proyek, us.nama AS nama_pelapor
            FROM tb_eskalasi e
            JOIN tb_tugas t   ON t.id_tugas   = e.id_tugas
            JOIN tb_proyek p  ON p.id_proyek  = t.id_proyek
            JOIN tb_user us   ON us.id_user   = e.id_user
           ${u.role === 'technician' ? 'WHERE e.id_user = $1' : ''}
           ORDER BY e.created_at DESC`;
        const r = (await query<Esk>(sql, u.role === 'technician' ? [u.id] : [])).rows;

        let tugasTeknisi: { id_tugas: number; label: string }[] = [];
        if (u.role === 'technician') {
          tugasTeknisi = (await query<{ id_tugas: number; nama_tugas: string; nama_proyek: string }>(
            `SELECT t.id_tugas, t.nama_tugas, p.nama_proyek
               FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek = t.id_proyek
              WHERE t.id_user = $1 AND t.status <> 'done'`,
            [u.id],
          )).rows.map((x) => ({ id_tugas: x.id_tugas, label: `${x.nama_tugas} — ${x.nama_proyek}` }));
        }
        return (
          <div className="space-y-6">
            {u.role === 'technician' && <FormEskalasi tugas={tugasTeknisi} />}
            <TabelEskalasi data={r} peran={u.role} />
          </div>
        );
      }}
    </Shell>
  );
}
