"use client";

import { useCallback, useEffect, useState } from "react";
import { formatToken } from "@/lib/format";

const PIN_KEY = "queue_staff_pin";

export default function StaffPage() {
  const [pin, setPin] = useState(null); // null = checking, "" = needs login
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [added, setAdded] = useState(null); // last walk-in token, to read out to the customer
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const call = useCallback(async (action, p) => {
    return fetch(`/api/staff/${action}`, {
      method: "POST",
      headers: { "x-staff-pin": p },
    });
  }, []);

  // Restore a saved PIN for this browser tab.
  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(PIN_KEY) || ""; } catch {}
    if (!saved) return setPin("");
    call("verify", saved).then((r) => setPin(r.ok ? saved : ""));
  }, [call]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!pin) return;
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [pin, refresh]);

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await call("verify", input);
    if (res.ok) {
      try { sessionStorage.setItem(PIN_KEY, input); } catch {}
      setPin(input);
    } else {
      setError("Wrong PIN. Try again.");
    }
  }

  // Runs a staff action. Returns the response body, or null on failure.
  async function act(action) {
    setBusy(true);
    setError("");
    try {
      const res = await call(action, pin);
      if (res.status === 401) {
        setPin("");
        return null;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "That didn’t work. Try again.");
        await refresh();
        return null;
      }
      await refresh();
      return body;
    } catch {
      setError("That didn’t work. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function addWalkIn() {
    const r = await act("add");
    if (r?.number) setAdded({ number: r.number, ahead: r.ahead });
  }

  async function others(action) {
    setAdded(null);
    await act(action);
  }

  async function startSession() {
    setAdded(null);
    await act("start");
  }

  async function endSession() {
    if (!confirm("End the session? Anyone still waiting will lose their place.")) return;
    setAdded(null);
    await act("end");
  }

  if (pin === null) {
    return <main className="page"><p className="muted">Loading…</p></main>;
  }

  if (pin === "") {
    return (
      <main className="page">
        <h1>Staff sign-in</h1>
        <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label htmlFor="pin" className="muted small">Enter the staff PIN</label>
          <input
            id="pin"
            className="field"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn" type="submit">Sign in</button>
          {error && <p className="error">{error}</p>}
        </form>
      </main>
    );
  }

  if (!data) {
    return <main className="page"><p className="muted">Loading…</p></main>;
  }

  // Queue is closed: the only thing to do is start a session.
  if (!data.sessionOpen) {
    return (
      <main className="page">
        <div className="closed-note">
          <h1>The queue is closed</h1>
          <p className="muted">
            Customers can’t take tokens until you start a session. Numbers will begin at A-001.
          </p>
        </div>
        <button className="btn big" onClick={startSession} disabled={busy}>
          Start queue session
        </button>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  const hasWaiting = data.waiting > 0;

  return (
    <main className="page">
      <div className="panel">
        <p className="muted">Now serving</p>
        <p className="number">{formatToken(data.serving)}</p>
        <div className="counts">
          <div><strong>{data.waiting}</strong><span className="muted small">waiting</span></div>
          <div><strong>{formatToken(data.nextNumber)}</strong><span className="muted small">up next</span></div>
        </div>
      </div>

      <button className="btn big" onClick={() => others("next")} disabled={busy || !hasWaiting}>
        Call next
      </button>
      <div className="row">
        <button className="btn secondary" onClick={() => others("recall")} disabled={busy || !data.serving}>
          Recall
        </button>
        <button className="btn secondary" onClick={() => others("skip")} disabled={busy || !data.serving}>
          Skip
        </button>
      </div>

      <button className="btn secondary" onClick={addWalkIn} disabled={busy}>
        + Add walk-in token
      </button>

      {added && (
        <div className="added" role="status">
          <p>Tell the customer their number</p>
          <p className="number">{formatToken(added.number)}</p>
          <p className="small">
            {added.ahead === 0 ? "They’re next." : `${added.ahead} ${added.ahead === 1 ? "person" : "people"} ahead of them.`}
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button className="btn danger" onClick={endSession} disabled={busy}>
        End session
      </button>
    </main>
  );
}
