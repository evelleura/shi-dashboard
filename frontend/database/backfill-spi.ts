/**
 * Backfill project_health (SPI) untuk SEMUA proyek.
 *
 * Kenapa: baris yang di-seed langsung lewat init.sql tidak melewati recalculateSPI(),
 * dan recalculateAllActiveSPI() hanya menyentuh status='active'. Akibatnya sebagian
 * proyek (tanpa tugas / completed / on-hold) bisa tak punya baris project_health,
 * sehingga dashboard, laporan, dan daftar proyek menampilkan SPI "-"/"N/A".
 *
 * Skrip ini menghitung ulang health untuk SEMUA proyek lewat recalculateSPI milik app,
 * jadi nilainya identik dengan hasil perubahan status tugas. Idempotent.
 *
 * Run: bunx tsx database/backfill-spi.ts
 *   (inject DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME, sama seperti dev server)
 */
import pool from '../src/lib/db';
import { recalculateSPI } from '../src/lib/spiCalculator';

async function main() {
  const { rows } = await pool.query<{ id: number }>('SELECT id_proyek AS id FROM tb_proyek ORDER BY id_proyek');
  let ok = 0;
  for (const { id } of rows) {
    const health = await recalculateSPI(id);
    if (health) {
      ok++;
      console.log(`  proyek ${id}: SPI=${Number(health.spi_value).toFixed(3)} (${health.status})`);
    } else {
      console.warn(`  proyek ${id}: dilewati (tidak ditemukan)`);
    }
  }
  console.log(`\n[OK] Backfill SPI untuk ${ok}/${rows.length} proyek.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Backfill gagal:', err);
  process.exit(1);
});
