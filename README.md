# Queue demo (Next.js + Supabase)

Scan a QR code, get a token, watch your turn approach. Numbers restart every day.

## Setup
1. Supabase: SQL Editor > run `schema.sql` (it drops and recreates the tables).
2. Supabase: click Connect > **Transaction pooler** (port 6543). The `.env.example` comments show which part goes in which variable.
3. Copy `.env.example` to `.env.local` and fill in the `DB_*` values, `STAFF_PIN`, `QUEUE_TZ`.
4. `npm install` then `npm run dev`.

## Pages
- `/q`        customer page (what the QR code opens)
- `/staff`    PIN-protected: Start/End session, Call next, Recall, Skip, Add walk-in token
- `/display`  waiting-room screen with Now serving and the QR code

## Deploy on Vercel
Push to GitHub, import the repo in Vercel, add the same env vars, deploy.
