import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

async function globalSetup() {
  // Verify test DB is accessible
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'shi_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
  });

  try {
    await pool.query('SELECT 1');
    console.log('Test database connection successful');
  } catch (err) {
    throw new Error(`Test database "shi_test" not accessible. Run: createdb shi_test && bun run db:test:setup\n${err}`);
  } finally {
    await pool.end();
  }
}

export default globalSetup;
