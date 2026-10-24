import { pool, today } from "@/lib/db";

// The id of today's open session, or null if the queue is closed.
// A session left open from a previous day counts as closed.
export async function getOpenSessionId(db = pool) {
  const { rows } = await db.query(
    `select id from sessions where closed_at is null and opened_on = $1::date`,
    [today()]
  );
  return rows[0]?.id ?? null;
}

// Issue the next number in a session. `source` is 'qr' (customer) or 'staff' (walk-in).
// If two requests grab the same number, the unique (session_id, number)
// constraint rejects one and we retry with the next number.
export async function issueToken(sessionId, source) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { rows } = await pool.query(
        `insert into tokens (session_id, number, source)
         select $1::bigint, coalesce(max(number), 0) + 1, $2
         from tokens where session_id = $1::bigint
         returning id, number`,
        [sessionId, source]
      );
      return rows[0];
    } catch (err) {
      if (err.code !== "23505") throw err;
    }
  }
  throw new Error("Queue is busy, try again");
}
