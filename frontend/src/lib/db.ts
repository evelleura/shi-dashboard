import { Pool } from "pg";

// Prevent multiple Pool instances during hot reload in development
const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

const pool =
  globalForPg.pgPool ??
  new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export const query = <T = unknown>(text: string, params?: unknown[]) =>
  pool.query<T & Record<string, unknown>>(text, params);

export const getClient = () => pool.connect();

export default pool;
