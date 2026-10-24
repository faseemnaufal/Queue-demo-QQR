import { NextResponse } from "next/server";
import { getOpenSessionId, issueToken } from "@/lib/queue";

export const dynamic = "force-dynamic";

// Customer self-service: only works while staff have a session open.
export async function POST() {
  try {
    const sessionId = await getOpenSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: "closed" }, { status: 403 });
    }
    const token = await issueToken(sessionId, "qr");
    return NextResponse.json(token);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not issue a token" }, { status: 500 });
  }
}
