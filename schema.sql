-- Run this in Supabase: SQL Editor > New query.
-- NOTE: this DROPS the old tokens table (demo data only) and rebuilds it with sessions.

drop table if exists tokens;
drop table if exists sessions;

-- A "session" is one run of the queue. Staff start it in the morning and end it when done.
create table sessions (
  id         bigint generated always as identity primary key,
  opened_on  date        not null,           -- day it was started (in QUEUE_TZ)
  opened_at  timestamptz not null default now(),
  closed_at  timestamptz                      -- null = still open
);

-- At most one session can be open at a time.
create unique index sessions_one_open on sessions ((true)) where closed_at is null;

create table tokens (
  id          bigint generated always as identity primary key,
  session_id  bigint not null references sessions(id) on delete cascade,
  number      int    not null,
  status      text   not null default 'waiting'
              check (status in ('waiting', 'called', 'done', 'skipped')),
  source      text   not null default 'qr' check (source in ('qr', 'staff')),
  created_at  timestamptz not null default now(),
  called_at   timestamptz,
  unique (session_id, number)   -- numbers restart at 1 in every new session
);

create index tokens_session_status_idx on tokens (session_id, status, number);

-- Our API connects directly as the database owner (bypasses RLS).
-- RLS with no policies blocks Supabase's public REST API from touching these tables.
alter table sessions enable row level security;
alter table tokens   enable row level security;
