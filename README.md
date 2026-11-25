<img width="167" height="211" alt="staff-page" src="https://github.com/user-attachments/assets/f95c7a59-05b3-4ce4-b12c-08398769a2df" />
<img width="619" height="372" alt="staff-sign-in" src="https://github.com/user-attachments/assets/93d3d9f0-ec69-48ee-99d7-674cb9db0fce" />
<img width="473" height="312" alt="qr-display" src="https://github.com/user-attachments/assets/3e338a80-956b-4693-a31e-1dae0a12642e" />
<img width="149" height="131" alt="customer-token" src="https://github.com/user-attachments/assets/9921af68-7bb0-4bef-8a67-d766be1b600a" />

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
