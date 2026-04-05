import { query } from '../utils/db';
import { HealthStatus, ProjectHealth } from '../types';

/**
 * Calculate Planned Value (PV) as a percentage.
 * PV = (elapsed days / total duration) x 100
 * Clamped to [0, 100].
 */
export function calculatePlannedValue(startDate: Date, endDate: Date, referenceDate: Date = new Date()): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const ref = new Date(referenceDate).getTime();

  // Clamp reference date within project range
  const clamped = Math.max(start, Math.min(ref, end));
  const totalDuration = end - start;

  if (totalDuration <= 0) return 100;

  const elapsed = clamped - start;
  const pv = (elapsed / totalDuration) * 100;

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
 * Get task count breakdown for a project.
 * Uses PostgreSQL FILTER aggregate for efficiency.
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
      COUNT(*) FILTER (WHERE status IN ('working_on_it', 'in_progress'))::int AS working,
      COUNT(*) FILTER (WHERE status IN ('working_on_it', 'in_progress') AND due_date < CURRENT_DATE)::int AS overtime,
      COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('done'))::int AS overdue
    FROM tasks
    WHERE project_id = $1`,
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
 * Get the latest daily report progress for a project.
 * Used as fallback when no tasks exist (backward compatibility).
 */
async function getLatestReportProgress(projectId: number): Promise<number | null> {
  const result = await query<{ progress_percentage: string }>(
    `SELECT progress_percentage
     FROM daily_reports
     WHERE project_id = $1
     ORDER BY report_date DESC, created_at DESC
     LIMIT 1`,
    [projectId]
  );

  if (result.rowCount === 0) return null;
  return parseFloat(result.rows[0].progress_percentage);
}

/**
 * Recalculate SPI and health status for a given project.
 *
 * Primary SPI source: task completion ratio
 *   EV = (completed_tasks / total_tasks) * 100
 *
 * Fallback (no tasks): latest daily_report.progress_percentage
 *   EV = progress_percentage from most recent report
 *
 * SPI = EV / PV (where PV is time-based planned value)
 *
 * Edge cases:
 *   - PV = 0 (project not started): SPI = 1.0
 *   - total_tasks = 0 and no reports: SPI = 1.0
 *   - All tasks done with PV < 100: SPI > 1.0 (ahead of schedule)
 *   - Project past end_date: PV clamped to 100
 */
export async function recalculateSPI(projectId: number): Promise<ProjectHealth | null> {
  // Get project dates
  const projectResult = await query<{ start_date: Date; end_date: Date; status: string }>(
    'SELECT start_date, end_date, status FROM projects WHERE id = $1',
    [projectId]
  );

  if (projectResult.rowCount === 0) return null;
  const project = projectResult.rows[0];

  // Get task counts
  const taskCounts = await getTaskCounts(projectId);

  // Calculate PV (time-based)
  const today = new Date();
  const plannedValue = calculatePlannedValue(project.start_date, project.end_date, today);

  let actualProgress: number;

  if (taskCounts.total === 0) {
    // Fallback: use daily_reports progress if no tasks exist
    const reportProgress = await getLatestReportProgress(projectId);
    if (reportProgress !== null) {
      actualProgress = reportProgress;
    } else {
      // No tasks and no reports -- no data to evaluate
      actualProgress = 0;
    }
  } else {
    // Primary: task completion ratio
    actualProgress = (taskCounts.completed / taskCounts.total) * 100;
  }

  // SPI = EV / PV
  const spiValue = plannedValue > 0
    ? Math.round((actualProgress / plannedValue) * 10000) / 10000
    : 1;

  const deviationPercent = Math.round((actualProgress - plannedValue) * 100) / 100;
  const status = categorizeHealth(spiValue);

  // Upsert project_health with task counts
  const upsertResult = await query<ProjectHealth>(
    `INSERT INTO project_health
      (project_id, spi_value, status, deviation_percent, actual_progress, planned_progress,
       total_tasks, completed_tasks, working_tasks, overtime_tasks, overdue_tasks, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     ON CONFLICT (project_id)
     DO UPDATE SET
       spi_value = EXCLUDED.spi_value,
       status = EXCLUDED.status,
       deviation_percent = EXCLUDED.deviation_percent,
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
      deviationPercent,
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
    "SELECT id FROM projects WHERE status = 'active'"
  );

  for (const row of result.rows) {
    await recalculateSPI(row.id);
  }
}
