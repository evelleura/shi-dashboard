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

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shi_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

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
    if (seedArg) {
      await runSQL(path.join(scriptDir, 'seed.sql'));
      console.log('Seed data inserted.');
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
