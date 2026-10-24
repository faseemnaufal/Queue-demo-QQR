"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatToken } from "@/lib/format";

const KEY = "queue_token_id";

export default function CustomerPage() {
  const [ready, setReady] = useState(false);
  const [tokenId, setTokenId] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alerted = useRef(false);

  // Remember this person's token so a refresh doesn't issue a new one.
  useEffect(() => {
    try {
      setTokenId(localStorage.getItem(KEY));
    } catch {}
    setReady(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const url = tokenId ? `/api/status?tokenId=${tokenId}` : "/api/status";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError("");
    } catch {
      setError("Can't reach the queue. Trying again…");
    }
  }, [tokenId]);

  useEffect(() => {
    if (!ready) return;
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [ready, refresh]);

  const me = data?.me;

  // Buzz the phone once when it's this person's turn.
  useEffect(() => {
    if (me?.status === "called" && !alerted.current) {
      alerted.current = true;
      try { navigator.vibrate?.([300, 150, 300]); } catch {}
    }
    if (me?.status !== "called") alerted.current = false;
  }, [me?.status]);

  async function getToken() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tokens", { method: "POST" });
      if (res.status === 403) {
        setError("The queue isn’t open right now.");
        await refresh();
        return;
      }
      if (!res.ok) throw new Error();
      const t = await res.json();
      try { localStorage.setItem(KEY, String(t.id)); } catch {}
      setData(null);
      setTokenId(String(t.id));
    } catch {
      setError("Couldn't get a token. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !data) {
    return (
      <main className="page">
        <p className="muted">{error || "Loading…"}</p>
      </main>
    );
  }

  // No token yet (or the saved one no longer exists)
  if (!me) {
    if (!data.sessionOpen) {
      return (
        <main className="page">
          <div className="closed-note">
            <h1>The queue isn’t open right now</h1>
            <p className="muted">Please ask at the counter.</p>
          </div>
        </main>
      );
    }
    return (
      <main className="page join">
        <div>
          <h1>Get in line from your phone</h1>
          <p className="muted">
            {data.waiting === 0
              ? "No one is waiting right now."
              : `${data.waiting} ${data.waiting === 1 ? "person is" : "people are"} waiting.`}
          </p>
          <button className="btn big" onClick={getToken} disabled={busy}>
            {busy ? "Getting your token…" : "Get my token"}
          </button>
          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        </div>
      </main>
    );
  }

  if (me.status === "called") {
    return (
      <main className="page">
        <div className="ticket called" role="status">
          <p className="label">Your token</p>
          <p className="number">{formatToken(me.number)}</p>
          <div className="divider" />
          <p className="stat">It’s your turn</p>
          <p className="stat-sub">Please go to the counter now.</p>
        </div>
      </main>
    );
  }

  if (me.status === "waiting") {
    return (
      <main className="page">
        <div className="ticket">
          <p className="label">Your token</p>
          <p className="number">{formatToken(me.number)}</p>
          <div className="divider" />
          <p className="stat">
            {me.ahead === 0 ? "You’re next" : `${me.ahead} ${me.ahead === 1 ? "person" : "people"} ahead of you`}
          </p>
          <p className="stat-sub">Now serving {data.serving ? formatToken(data.serving) : "—"}</p>
        </div>
        <p className="muted small">Keep this page open. It updates by itself.</p>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  // done, skipped, or the session has ended
  const message =
    me.status === "skipped"
      ? "Your token was skipped because you weren’t there when it was called."
      : me.status === "done"
      ? "You’ve been served. Thank you!"
      : "This queue has ended.";

  return (
    <main className="page">
      <div className="ticket closed">
        <p className="label">Your token</p>
        <p className="number">{formatToken(me.number)}</p>
        <div className="divider" />
        <p className="stat-sub" style={{ marginTop: 0 }}>{message}</p>
      </div>
      {data.sessionOpen && (
        <button className="btn" onClick={getToken} disabled={busy}>
          {busy ? "Getting your token…" : "Get a new token"}
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
