import { Pool } from "pg";

// Connection settings come from separate env vars (DB_HOST, DB_PORT, DB_USER,
// DB_PASSWORD, DB_NAME), so the password can contain any characters.
// If DB_HOST is not set, we fall back to a single DATABASE_URL string.
function buildConfig() {
  if (process.env.DB_HOST) {
    return {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 6543),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "postgres",
    };
  }
  return { connectionString: process.env.DATABASE_URL };
}

// One small pool per serverless instance. Reused across hot invocations.
const g = globalThis;
export const pool =
  g._queuePool ||
  (g._queuePool = new Pool({
    ...buildConfig(),
    max: 1,
    ssl: { rejectUnauthorized: false },
  }));

// "Today" in the queue's timezone as YYYY-MM-DD.
// Token numbers are scoped to this date, so they restart each day with no cron job.
export function today() {
  const tz = process.env.QUEUE_TZ || "Asia/Kolkata";
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}
