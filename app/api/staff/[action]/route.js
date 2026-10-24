import { NextResponse } from "next/server";
import { pool, today } from "@/lib/db";
import { getOpenSessionId, issueToken } from "@/lib/queue";

export const dynamic = "force-dynamic";

// Close out whoever is currently called (as `finalStatus`), then call the next waiting token.
async function advance(sessionId, finalStatus) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `update tokens set status = $2 where session_id = $1 and status = 'called'`,
      [sessionId, finalStatus]
    );
    await client.query(
      `update tokens set status = 'called', called_at = now()
       where id = (
         select id from tokens
         where session_id = $1 and status = 'waiting'
         order by number limit 1
         for update skip locked
       )`,
      [sessionId]
    );
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

// Close any open session and start a fresh one, so numbering restarts at 1.
async function startSession() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`update sessions set closed_at = now() where closed_at is null`);
    await client.query(`insert into sessions (opened_on) values ($1::date)`, [today()]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function POST(req, { params }) {
  const { action } = await params;

  const pin = req.headers.get("x-staff-pin");
  if (!process.env.STAFF_PIN || pin !== process.env.STAFF_PIN) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  try {
    if (action === "verify") return NextResponse.json({ ok: true });

    if (action === "start") {
      await startSession();
      return NextResponse.json({ ok: true });
    }

    if (action === "end") {
      await pool.query(`update sessions set closed_at = now() where closed_at is null`);
      return NextResponse.json({ ok: true });
    }

    // Everything below needs an open session.
    const sessionId = await getOpenSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: "The queue is not open. Start a session first." }, { status: 409 });
    }

    switch (action) {
      case "add": {
        // Walk-in customer without a phone: staff issue a token and tell them the number.
        const token = await issueToken(sessionId, "staff");
        const { rows: [a] } = await pool.query(
          `select count(*)::int as ahead from tokens
           where session_id = $1 and status = 'waiting' and number < $2`,
          [sessionId, token.number]
        );
        return NextResponse.json({ ok: true, number: token.number, ahead: a.ahead });
      }
      case "next":
        await advance(sessionId, "done");
        break;
      case "skip":
        await advance(sessionId, "skipped");
        break;
      case "recall":
        // Bumps called_at so the display screen flashes again.
        await pool.query(
          `update tokens set called_at = now() where session_id = $1 and status = 'called'`,
          [sessionId]
        );
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
