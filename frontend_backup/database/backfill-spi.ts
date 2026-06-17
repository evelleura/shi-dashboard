/**
 * Backfill project_health (SPI) for EVERY project.
 *
 * Why: rows seeded directly via seed.sql never went through recalculateSPI(),
 * and recalculateAllActiveSPI() only touches status='active'. Result: some
 * projects (taskless / completed / on-hold / cancelled) had NO project_health
 * row, so the dashboard, reports and project list showed SPI as "-" / "N/A".
 *
 * This recomputes health for ALL projects using the app's own recalculateSPI,
 * so the backfilled values are identical to what a task change would produce.
 * Idempotent — safe to re-run.
 *
 * Run: bunx tsx database/backfill-spi.ts
 *   (inject DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME, same as the dev server)
 */
import pool from '../src/lib/db';
import { recalculateSPI } from '../src/lib/spiCalculator';

async function main() {
  const { rows } = await pool.query<{ id: number }>('SELECT id FROM projects ORDER BY id');
  let ok = 0;
  for (const { id } of rows) {
    const health = await recalculateSPI(id);
    if (health) {
      ok++;
      console.log(`  project ${id}: SPI=${Number(health.spi_value).toFixed(3)} (${health.status})`);
    } else {
      console.warn(`  project ${id}: skipped (not found)`);
    }
  }
  console.log(`\n[OK] Backfilled SPI for ${ok}/${rows.length} projects.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
