// Halaman Eskalasi — daftar + (untuk teknisi) form pengajuan eskalasi.
import { Shell } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { query } from '@/lib/db';
import { FormEskalasi, TombolTangani } from './form-client';

interface Baris {
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

export default async function HalamanEskalasi() {
  return (
    <Shell judul="Eskalasi">
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
        const r = (await query<Baris>(sql, u.role === 'technician' ? [u.id] : [])).rows;

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
            <div className="card overflow-x-auto">
              <h2 className="mb-3 text-base font-semibold">Daftar Eskalasi</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Judul</th>
                    <th>Tugas / Proyek</th>
                    <th>Pelapor</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {r.map((e) => (
                    <tr key={e.id_eskalasi} className="border-t align-top">
                      <td className="py-2">
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-slate-500">{e.description}</div>
                        {e.instruksi && (
                          <div className="mt-1 text-xs text-blue-700">
                            <strong>Instruksi manajer:</strong> {e.instruksi}
                          </div>
                        )}
                      </td>
                      <td className="text-slate-600">{e.nama_tugas}<br /><span className="text-xs">{e.nama_proyek}</span></td>
                      <td>{e.nama_pelapor}</td>
                      <td>{e.priority}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td>{new Date(e.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        {u.role === 'manager' && e.status !== 'closed' && (
                          <TombolTangani idEskalasi={e.id_eskalasi} sudahDitangani={e.status === 'ditangani'} />
                        )}
                      </td>
                    </tr>
                  ))}
                  {r.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-500">Belum ada eskalasi.</td></tr>
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
