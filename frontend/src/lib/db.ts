import { Pool, PoolClient } from "pg";

// Prevent multiple Pool instances during hot reload in development
const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

// Fly Postgres `attach` injects DATABASE_URL. Local dev uses split DB_* vars.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = globalForPg.pgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export const query = <T = unknown>(text: string, params?: unknown[]) =>
  pool.query<T & Record<string, unknown>>(text, params);

export const getClient = () => pool.connect();

// Jalankan fn dalam SATU transaksi (BEGIN/COMMIT; ROLLBACK saat error, release
// selalu). Dipakai eksekutor tindakan eskalasi (ganti_teknisi dll) supaya cascade
// reassign + jadwal + SPI + notif + audit atomik: gagal sebagian = batal semua.
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
