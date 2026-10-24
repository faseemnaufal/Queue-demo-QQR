import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getOpenSessionId } from "@/lib/queue";

export const dynamic = "force-dynamic";

// Queue snapshot. If ?tokenId= is given, also returns that token's state.
export async function GET(req) {
  try {
    const sessionId = await getOpenSessionId();

    const out = {
      sessionOpen: Boolean(sessionId),
      serving: null,
      calledAt: null,
      waiting: 0,
      nextNumber: null,
      me: null,
    };

    if (sessionId) {
      const { rows: [s] } = await pool.query(
        `select
           (select number    from tokens where session_id = $1 and status = 'called' order by called_at desc limit 1) as serving,
           (select called_at from tokens where session_id = $1 and status = 'called' order by called_at desc limit 1) as called_at,
           (select count(*)::int from tokens where session_id = $1 and status = 'waiting') as waiting,
           (select min(number)   from tokens where session_id = $1 and status = 'waiting') as next_number`,
        [sessionId]
      );
      out.serving = s.serving;
      out.calledAt = s.called_at;
      out.waiting = s.waiting;
      out.nextNumber = s.next_number;
    }

    const id = Number(new URL(req.url).searchParams.get("tokenId"));
    if (Number.isInteger(id) && id > 0) {
      const { rows: [t] } = await pool.query(
        `select id, number, status, session_id from tokens where id = $1`,
        [id]
      );
      if (t) {
        if (!sessionId || String(t.session_id) !== String(sessionId)) {
          out.me = { id: t.id, number: t.number, status: "expired", ahead: 0 };
        } else {
          const { rows: [a] } = await pool.query(
            `select count(*)::int as ahead from tokens
             where session_id = $1 and status = 'waiting' and number < $2`,
            [sessionId, t.number]
          );
          out.me = { id: t.id, number: t.number, status: t.status, ahead: a.ahead };
        }
      }
    }

    return NextResponse.json(out);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Status unavailable" }, { status: 500 });
  }
}
