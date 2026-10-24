import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <h1>Queue demo</h1>
      {/* <p className="muted">Three screens make up the system.</p>
      <Link href="/q" className="btn secondary" style={{ textDecoration: "none", textAlign: "center" }}>
        Customer page: what people see after scanning the QR code
      </Link> */}
      <Link href="/staff" className="btn secondary" style={{ textDecoration: "none", textAlign: "center" }}>
        Staff page: call the next token
      </Link>
      <Link href="/display" className="btn secondary" style={{ textDecoration: "none", textAlign: "center" }}>
        Waiting-room screen: now serving and the QR code
      </Link>
    </main>
  );
}
