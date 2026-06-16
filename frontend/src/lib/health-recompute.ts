// Rekalkulasi project_health dari data tugas + jadwal proyek.
// Dipicu setelah status tugas berubah / tugas dibuat / dihapus.
import { query } from './db';
import { hitungSPI } from './spi';
import { klasifikasiKesehatan } from './health';

export async function rekalkulasiKesehatan(idProyek: number): Promise<void> {
  const proyek = await query<{
    id_proyek: number;
    start_date: string;
    end_date: string;
  }>(
    'SELECT id_proyek, start_date, end_date FROM tb_proyek WHERE id_proyek = $1',
    [idProyek],
  );
  if (proyek.rows.length === 0) return;
  const p = proyek.rows[0];

  const agg = await query<{
    total: string;
    selesai: string;
    bekerja: string;
    overdue: string;
    overtime: string;
  }>(
    `SELECT
        COUNT(*)::int                                                                AS total,
        COUNT(*) FILTER (WHERE status = 'done')::int                                  AS selesai,
        COUNT(*) FILTER (WHERE status = 'working_on')::int                            AS bekerja,
        COUNT(*) FILTER (WHERE status = 'to_do'      AND due_date < CURRENT_DATE)::int AS overdue,
        COUNT(*) FILTER (WHERE status = 'working_on' AND due_date < CURRENT_DATE)::int AS overtime
     FROM tb_tugas
     WHERE id_proyek = $1`,
    [idProyek],
  );
  const a = agg.rows[0];
  const total = Number(a.total);
  const selesai = Number(a.selesai);
  const bekerja = Number(a.bekerja);
  const overdue = Number(a.overdue);
  const overtime = Number(a.overtime);

  const hasil = hitungSPI({
    startDate: p.start_date,
    endDate: p.end_date,
    totalTugas: total,
    tugasSelesai: selesai,
  });
  const status = klasifikasiKesehatan(hasil.spi);

  await query(
    `INSERT INTO project_health (project_id, spi_value, status,
        actual_progress, planned_progress, total_tasks,
        completed_tasks, working_tasks, overtime_tasks, overdue_tasks, last_updated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
     ON CONFLICT (project_id) DO UPDATE SET
       spi_value        = EXCLUDED.spi_value,
       status           = EXCLUDED.status,
       actual_progress  = EXCLUDED.actual_progress,
       planned_progress = EXCLUDED.planned_progress,
       total_tasks      = EXCLUDED.total_tasks,
       completed_tasks  = EXCLUDED.completed_tasks,
       working_tasks    = EXCLUDED.working_tasks,
       overtime_tasks   = EXCLUDED.overtime_tasks,
       overdue_tasks    = EXCLUDED.overdue_tasks,
       last_updated     = NOW()`,
    [idProyek, hasil.spi, status, hasil.actualProgress, hasil.plannedProgress,
      total, selesai, bekerja, overtime, overdue],
  );
}
