/**
 * Database setup script
 * Run: npx tsx database/setup.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load .env.local first (Next.js convention), fallback to .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'shi_dashboard',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      },
);

async function runSQL(filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  await pool.query(sql);
  console.log(`Done: ${path.basename(filePath)}`);
}

async function main() {
  console.log('Setting up database...');
  try {
    const scriptDir = path.resolve(path.dirname(process.argv[1] || __filename));
    // Skema + 8 user dasar. init.sql idempotent: CREATE TABLE IF NOT EXISTS +
    // seed user dijaga "IF NOT EXISTS (SELECT 1 FROM tb_user)". Sama dgn jalur
    // lokal run.py (tabel Indonesia tb_user/tb_proyek, BUKAN schema.sql English).
    await runSQL(path.join(scriptDir, 'init.sql'));
    console.log('Schema + base users ready.');

    const seedArg = process.argv.includes('--seed');
    const forceSeed = process.argv.includes('--force-seed');
    if (seedArg || forceSeed) {
      if (forceSeed) {
        // "Wipe & reseed": kosongkan SEMUA (CASCADE) lalu bangun ulang 8 user
        // dasar via init.sql. seed.sql termuat lagi karena tb_proyek jadi kosong.
        console.log('Force-seed: truncating tb_user (+ CASCADE) and reseeding ...');
        await pool.query('TRUNCATE TABLE tb_user RESTART IDENTITY CASCADE');
        await runSQL(path.join(scriptDir, 'init.sql')); // re-insert 8 user dasar
      }
      // seed.sql self-guard "IF NOT EXISTS (SELECT 1 FROM tb_proyek)": load HANYA
      // saat DB belum punya proyek -> aman diulang tiap deploy tanpa dup-key.
      await runSQL(path.join(scriptDir, 'seed.sql'));
      console.log('Operational seed applied (or skipped by self-guard).');
    }

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
