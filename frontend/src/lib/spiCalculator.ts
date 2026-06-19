import { query } from './db';

export type HealthStatus = 'green' | 'amber' | 'red';

// SPI baru bermakna kalau proyek sudah berjalan minimal sekian persen durasi (PV).
// Di bawah itu -> "Belum Dinilai" (null), supaya proyek baru tak menampilkan SPI
// prematur/absurd (mis. SPI 1 utk proyek kosong, atau SPI 10 utk yang baru mulai
// tapi sudah ada tugas selesai -> EV/PV meledak saat PV kecil).
const MIN_PV_FOR_SPI = 5;   // persen durasi berjalan
const SPI_CAP = 2;          // selaras domain chart [0,2]; SPI > 1 = di depan jadwal

export interface ProjectHealth {
  project_id: number;
  spi_value: number | null;
  status: HealthStatus | null;
  actual_progress: number;
  planned_progress: number;
  total_tasks: number;
  completed_tasks: number;
  working_tasks: number;
  overtime_tasks: number;
  overdue_tasks: number;
  last_updated: Date;
}

/**
 * Calculate Planned Value (PV) as a percentage.
 * PV = (elapsed days / total duration) x 100
 * Clamped to [0, 100].
 */
export function calculatePlannedValue(startDate: Date, endDate: Date, referenceDate: Date = new Date()): number {
  const DAY_MS = 86400000;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const ref = new Date(referenceDate).getTime();

  // Clamp reference date within project range
  const clamped = Math.max(start, Math.min(ref, end));
  const totalDuration = end - start;

  if (totalDuration <= 0) return 100;

  // PV pakai HARI PENUH (Math.floor): start_date/end_date = tengah malam, tapi "hari
  // ini" (referenceDate) punya komponen jam. Tanpa floor, pecahan jam menggelembungkan
  // elapsed -> PV naik -> SPI proyek aktif turun -> proyek baru-jalan tampil MERAH
  // PALSU (mis. SPI 0.80 utk yang seharusnya ~1.0). Floor menyetarakan PV dengan EV
  // tugas yang diskret per hari, selaras cabang proyek-selesai (durasi pakai floor).
  const elapsedDays = Math.floor((clamped - start) / DAY_MS);
  const totalDays = totalDuration / DAY_MS;
  const pv = (elapsedDays / totalDays) * 100;

  return Math.min(100, Math.max(0, Math.round(pv * 100) / 100));
}

/**
 * Determine health status from SPI value.
 * Green: SPI >= 0.95
 * Amber: 0.85 <= SPI < 0.95
 * Red: SPI < 0.85
 */
export function categorizeHealth(spiValue: number): HealthStatus {
  if (spiValue >= 0.95) return 'green';
  if (spiValue >= 0.85) return 'amber';
  return 'red';
}

/**
 * Get task count breakdown for a project. (tb_tugas, status 3 sesuai naskah)
 */
export async function getTaskCounts(projectId: number): Promise<{
  total: number;
  completed: number;
  working: number;
  overtime: number;
  overdue: number;
}> {
  const result = await query<{
    total: string;
    completed: string;
    working: string;
    overtime: string;
    overdue: string;
  }>(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'done')::int AS completed,
      COUNT(*) FILTER (WHERE status = 'working_on_it')::int AS working,
      COUNT(*) FILTER (WHERE status = 'working_on_it' AND due_date < CURRENT_DATE)::int AS overtime,
      COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('done'))::int AS overdue
    FROM tb_tugas
    WHERE id_proyek = $1`,
    [projectId]
  );

  const row = result.rows[0];
  return {
    total: parseInt(String(row.total)) || 0,
    completed: parseInt(String(row.completed)) || 0,
    working: parseInt(String(row.working)) || 0,
    overtime: parseInt(String(row.overtime)) || 0,
    overdue: parseInt(String(row.overdue)) || 0,
  };
}

/**
 * Get the latest daily report progress for a project. (cadangan EV saat 0 tugas)
 */
async function getLatestReportProgress(projectId: number): Promise<number | null> {
  const result = await query<{ progress_percentage: string }>(
    `SELECT progress_percentage
     FROM daily_reports
     WHERE project_id = $1 AND progress_percentage IS NOT NULL
     ORDER BY report_date DESC, created_at DESC
     LIMIT 1`,
    [projectId]
  );

  if (result.rowCount === 0) return null;
  return parseFloat(result.rows[0].progress_percentage);
}

/**
 * Tanggal penyelesaian AKTUAL proyek = waktu tugas terakhir ditandai 'done'
 * (MAX status_changed_at). Dipakai SPI proyek selesai (durasi rencana vs aktual).
 */
async function getActualCompletionDate(projectId: number): Promise<Date | null> {
  const result = await query<{ done_at: Date | null }>(
    `SELECT MAX(status_changed_at) AS done_at
     FROM tb_tugas
     WHERE id_proyek = $1 AND status = 'done'`,
    [projectId]
  );
  return result.rows[0]?.done_at ?? null;
}

/**
 * Recalculate SPI and health status for a given project.
 */
export async function recalculateSPI(projectId: number): Promise<ProjectHealth | null> {
  const projectResult = await query<{ start_date: Date; end_date: Date; status: string }>(
    'SELECT start_date, end_date, status FROM tb_proyek WHERE id_proyek = $1',
    [projectId]
  );

  if (projectResult.rowCount === 0) return null;
  const project = projectResult.rows[0];

  const taskCounts = await getTaskCounts(projectId);

  const today = new Date();
  const plannedValue = calculatePlannedValue(project.start_date, project.end_date, today);

  let actualProgress = 0;
  let hasBasis = true;  // ada dasar EV (tugas atau laporan harian)?

  if (taskCounts.total === 0) {
    const reportProgress = await getLatestReportProgress(projectId);
    if (reportProgress !== null) {
      actualProgress = reportProgress;
    } else {
      hasBasis = false;  // 0 tugas & 0 laporan -> tak ada dasar EV
    }
  } else {
    actualProgress = (taskCounts.completed / taskCounts.total) * 100;
  }

  // SPI hanya bermakna kalau ADA dasar EV DAN proyek sudah berjalan >= MIN_PV_FOR_SPI.
  // Kalau belum -> "Belum Dinilai" (spi_value/status NULL) -> UI tampil '--', tak ikut
  // rata-rata SPI, masuk hitungan "Belum Dinilai". Bukan angka prematur (1) atau absurd (10).
  const measurable = hasBasis && plannedValue >= MIN_PV_FOR_SPI;

  let spiValue: number | null;
  let status: HealthStatus | null;

  if (project.status === 'completed' && taskCounts.total > 0 && taskCounts.completed > 0) {
    // PROYEK SELESAI: SPI = efisiensi jadwal akhir = durasi_rencana / durasi_aktual.
    // EVM klasik memaksa SPI->1 saat selesai (EV=PV=100% di tanggal akhir) -> tak
    // informatif & bikin "SPI 1 semua" di riwayat. Untuk proyek selesai yang
    // bermakna (tepat waktu / lebih cepat / telat), pakai rasio durasi:
    //   selesai lebih cepat dari rencana -> SPI > 1; lebih lambat -> SPI < 1.
    // Durasi aktual diukur dari tugas terakhir di-'done' (MAX status_changed_at).
    // Hitung durasi dalam HARI PENUH dari awal proyek. start_date & end_date =
    // tanggal (tengah malam); status_changed_at = timestamp (mis. 14:00). Pakai
    // Math.floor supaya komponen jam (mis. +0.58 hari) TIDAK membulat ke atas dan
    // menggelembungkan durasi aktual -> bias "telat/merah" palsu utk proyek tepat waktu.
    const DAY_MS = 86400000;
    const startMs = new Date(project.start_date).getTime();
    const plannedEndMs = new Date(project.end_date).getTime();
    const plannedDur = Math.max(1, Math.floor((plannedEndMs - startMs) / DAY_MS));
    const actualEnd = await getActualCompletionDate(projectId);
    const actualDur = actualEnd
      ? Math.max(1, Math.floor((new Date(actualEnd).getTime() - startMs) / DAY_MS))
      : plannedDur;
    const raw = Math.round((plannedDur / actualDur) * 10000) / 10000;
    spiValue = Math.min(raw, SPI_CAP);
    status = categorizeHealth(spiValue);
    actualProgress = 100; // selesai => seluruh tugas done
  } else if (!measurable) {
    spiValue = null;
    status = null;
  } else {
    // Cap di SPI_CAP supaya tak ada angka absurd saat PV masih kecil; >1 = di depan jadwal.
    const raw = Math.round((actualProgress / plannedValue) * 10000) / 10000;
    spiValue = Math.min(raw, SPI_CAP);
    status = categorizeHealth(spiValue);
  }

  const upsertResult = await query<ProjectHealth>(
    `INSERT INTO project_health
      (project_id, spi_value, status, actual_progress, planned_progress,
       total_tasks, completed_tasks, working_tasks, overtime_tasks, overdue_tasks, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (project_id)
     DO UPDATE SET
       spi_value = EXCLUDED.spi_value,
       status = EXCLUDED.status,
       actual_progress = EXCLUDED.actual_progress,
       planned_progress = EXCLUDED.planned_progress,
       total_tasks = EXCLUDED.total_tasks,
       completed_tasks = EXCLUDED.completed_tasks,
       working_tasks = EXCLUDED.working_tasks,
       overtime_tasks = EXCLUDED.overtime_tasks,
       overdue_tasks = EXCLUDED.overdue_tasks,
       last_updated = NOW()
     RETURNING *`,
    [
      projectId,
      spiValue,
      status,
      Math.round(actualProgress * 100) / 100,
      plannedValue,
      taskCounts.total,
      taskCounts.completed,
      taskCounts.working,
      taskCounts.overtime,
      taskCounts.overdue,
    ]
  );

  return upsertResult.rows[0];
}

/**
 * Recalculate SPI for all active projects.
 */
export async function recalculateAllActiveSPI(): Promise<void> {
  const result = await query<{ id: number }>(
    "SELECT id_proyek AS id FROM tb_proyek WHERE status = 'active'"
  );

  for (const row of result.rows) {
    await recalculateSPI(row.id);
  }
}
