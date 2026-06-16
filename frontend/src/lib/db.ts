// Koneksi pool ke PostgreSQL.
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function buildPool(): Pool {
  return new Pool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'shi',
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

export const pool: Pool = global._pgPool ?? buildPool();
if (process.env.NODE_ENV !== 'production') global._pgPool = pool;

// Helper kueri parameterized agar aman dari SQL injection.
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}
