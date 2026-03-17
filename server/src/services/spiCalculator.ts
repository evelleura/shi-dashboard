import { query } from '../utils/db';
import { HealthStatus, ProjectHealth } from '../types';

/**
 * Calculate Planned Value (PV) as a percentage.
 * PV = (elapsed days / total duration) × 100
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
 * Recalculate SPI and health status for a given project.
 * Uses the latest daily report's progress as the Earned Value.
 * Upserts results into project_health table.
 */
export async function recalculateSPI(projectId: number): Promise<ProjectHealth | null> {
  // Get project dates
  const projectResult = await query<{ start_date: Date; end_date: Date; status: string }>(
    'SELECT start_date, end_date, status FROM projects WHERE id = $1',
    [projectId]
  );

  if (projectResult.rowCount === 0) return null;

  const project = projectResult.rows[0];

  // Get the latest progress_percentage for the project
  const reportResult = await query<{ progress_percentage: string; report_date: Date }>(
    `SELECT progress_percentage, report_date
     FROM daily_reports
     WHERE project_id = $1
     ORDER BY report_date DESC, created_at DESC
     LIMIT 1`,
    [projectId]
  );

  // Use today as reference date for PV calculation
  const today = new Date();
  const plannedValue = calculatePlannedValue(project.start_date, project.end_date, today);

  let spiValue: number;
  let actualProgress: number;

  if (reportResult.rowCount === 0) {
    // No reports yet - EV = 0
    actualProgress = 0;
    spiValue = plannedValue > 0 ? 0 / plannedValue : 1;
  } else {
    actualProgress = parseFloat(reportResult.rows[0].progress_percentage);
    spiValue = plannedValue > 0 ? actualProgress / plannedValue : 1;
  }

  const deviationPercent = actualProgress - plannedValue;
  const status = categorizeHealth(spiValue);

  // Upsert project_health
  const upsertResult = await query<ProjectHealth>(
    `INSERT INTO project_health (project_id, spi_value, status, deviation_percent, actual_progress, planned_progress, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (project_id)
     DO UPDATE SET
       spi_value = EXCLUDED.spi_value,
       status = EXCLUDED.status,
       deviation_percent = EXCLUDED.deviation_percent,
       actual_progress = EXCLUDED.actual_progress,
       planned_progress = EXCLUDED.planned_progress,
       last_updated = NOW()
     RETURNING *`,
    [projectId, spiValue, status, deviationPercent, actualProgress, plannedValue]
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
