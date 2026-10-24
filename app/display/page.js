"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatToken } from "@/lib/format";

export default function DisplayPage() {
  const [data, setData] = useState(null);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/q`);
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok && alive) setData(await res.json());
      } catch {}
    }
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (data && !data.sessionOpen) {
    return (
      <main className="display">
        <section className="serving">
          <p className="number" style={{ fontSize: "clamp(48px, 9vw, 120px)" }}>Queue closed</p>
          <p className="waiting muted">Please ask at the counter.</p>
        </section>
        <aside className="join-side" />
      </main>
    );
  }

  const waiting = data?.waiting ?? 0;

  return (
    <main className="display">
      {/* key restarts the flash animation each time a token is called or recalled */}
      <section className="serving flash" key={data?.calledAt || "none"}>
        <p className="label">Now serving</p>
        <p className="number">{formatToken(data?.serving)}</p>
        <p className="waiting muted">
          {waiting === 0 ? "No one is waiting" : `${waiting} waiting`}
        </p>
      </section>

      <aside className="join-side">
        {joinUrl && (
          <div className="qr">
            <QRCodeSVG value={joinUrl} size={280} level="M" />
          </div>
        )}
        <p>Scan to get your token</p>
      </aside>
    </main>
  );
}
