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
    await runSQL(path.join(scriptDir, 'schema.sql'));
    console.log('Schema created.');

    const seedArg = process.argv.includes('--seed');
    const forceSeed = process.argv.includes('--force-seed');
    if (seedArg || forceSeed) {
      // Idempotency guard: seed.sql contains many non-ON-CONFLICT INSERTs.
      // Re-running it on a populated DB would duplicate-key crash. Skip
      // unless --force-seed is passed explicitly.
      const { rows } = await pool.query<{ n: string }>(
        'SELECT COUNT(*)::text AS n FROM users',
      );
      const userCount = parseInt(rows[0].n, 10);
      if (userCount > 0 && !forceSeed) {
        console.log(`Seed: skipped (users table already has ${userCount} rows).`);
      } else {
        await runSQL(path.join(scriptDir, 'seed.sql'));
        console.log('Seed data inserted.');
      }
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
