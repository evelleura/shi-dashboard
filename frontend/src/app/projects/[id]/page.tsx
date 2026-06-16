// Halaman Detail Proyek (Gambar 5.27) — info proyek + Kanban tugas.
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { HealthBadge } from '@/components/HealthBadge';
import { query } from '@/lib/db';
import type { StatusKesehatan } from '@/lib/health';
import { KanbanTugas } from './kanban-client';
import { FormApproveTombol } from './approve-client';

interface Proyek {
  id_proyek: number;
  nama_proyek: string;
  project_code: string | null;
  description: string | null;
  category: string | null;
  phase: 'survey' | 'execution';
  status: string;
  start_date: string;
  end_date: string;
  nama_klien: string | null;
  spi_value: number | null;
  health_status: StatusKesehatan | null;
  actual_progress: number | null;
  planned_progress: number | null;
  total_tasks: number | null;
  completed_tasks: number | null;
  working_tasks: number | null;
  overdue_tasks: number | null;
}

interface Tugas {
  id_tugas: number;
  nama_tugas: string;
  status: 'to_do' | 'working_on' | 'done';
  due_date: string | null;
  id_user: number | null;
  nama_teknisi: string | null;
}

export default async function HalamanDetailProyek({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idProyek = Number(id);
  if (!Number.isFinite(idProyek)) notFound();

  return (
    <Shell judul="Detail Proyek">
      {async (u) => {
        const r = await query<Proyek>(
          `SELECT p.id_proyek, p.nama_proyek, p.project_code, p.description, p.category,
                  p.phase, p.status, p.start_date, p.end_date,
                  c.nama_klien,
                  ph.spi_value, ph.status AS health_status,
                  ph.actual_progress, ph.planned_progress,
                  ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overdue_tasks
             FROM tb_proyek p
             LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
             LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
            WHERE p.id_proyek = $1`,
          [idProyek],
        );
        if (r.rows.length === 0) notFound();
        const p = r.rows[0];

        const tugas = (await query<Tugas>(
          `SELECT t.id_tugas, t.nama_tugas, t.status, t.due_date, t.id_user,
                  uu.nama AS nama_teknisi
             FROM tb_tugas t LEFT JOIN tb_user uu ON uu.id_user = t.id_user
            WHERE t.id_proyek = $1
            ORDER BY t.sort_order, t.id_tugas`,
          [idProyek],
        )).rows;

        return (
          <div className="space-y-6">
            <div className="card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{p.nama_proyek}</h2>
                <div className="flex gap-2">
                  <StatusBadge status={p.phase} />
                  <StatusBadge status={p.status} />
                  <HealthBadge status={p.health_status} />
                </div>
              </div>
              <p className="text-sm text-slate-600">{p.description ?? '—'}</p>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                <Info label="Kode" value={p.project_code ?? '-'} />
                <Info label="Klien" value={p.nama_klien ?? '-'} />
                <Info label="Kategori" value={p.category ?? '-'} />
                <Info label="Tenggat" value={p.end_date.toString().slice(0, 10)} />
                <Info label="SPI" value={p.spi_value !== null ? Number(p.spi_value).toFixed(3) : '-'} />
                <Info label="Progres Aktual (EV)" value={`${Number(p.actual_progress ?? 0).toFixed(2)} %`} />
                <Info label="Progres Rencana (PV)" value={`${Number(p.planned_progress ?? 0).toFixed(2)} %`} />
                <Info label="Tugas (Selesai/Total)" value={`${p.completed_tasks ?? 0} / ${p.total_tasks ?? 0}`} />
              </div>
            </div>

            {u.role === 'manager' && p.phase === 'survey' && (
              <div className="card border-amber-300 bg-amber-50">
                <h3 className="mb-1 font-semibold">Fase Survei</h3>
                <p className="mb-3 text-sm text-slate-700">
                  Setujui hasil survei untuk berpindah ke fase Eksekusi.
                </p>
                <FormApproveTombol idProyek={idProyek} />
              </div>
            )}

            <KanbanTugas
              tugas={tugas.map((t) => ({
                id_tugas: t.id_tugas,
                nama_tugas: t.nama_tugas,
                status: t.status,
                due_date: t.due_date,
                nama_teknisi: t.nama_teknisi,
              }))}
              peran={u.role}
              idUserSesi={u.id}
              idProyek={idProyek}
            />
          </div>
        );
      }}
    </Shell>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
