-- Together — multi-tenant foundation (run in Supabase → SQL Editor).
-- Adds people + invites so each couple sees only their own data.

alter table couples add column if not exists created_at timestamptz default now();

-- A person, keyed by their Telegram id; belongs to exactly one couple.
create table if not exists app_users (
  telegram_id bigint primary key,
  couple_id   uuid references couples(id) on delete set null,
  name        text,
  photo_url   text,
  created_at  timestamptz default now()
);

-- One-time invite links to join a couple.
create table if not exists invites (
  token       text primary key,
  couple_id   uuid not null references couples(id) on delete cascade,
  created_by  bigint,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days'),
  used_by     bigint,
  used_at     timestamptz
);
create index if not exists app_users_couple_idx on app_users(couple_id);

-- Preserve the current data: keep couple c1, register Dima + Anya as its members.
insert into couples (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Дима и Аня')
  on conflict (id) do nothing;
insert into app_users (telegram_id, couple_id, name) values
  (681332519, '00000000-0000-0000-0000-0000000000c1', 'Дима'),
  (344423348, '00000000-0000-0000-0000-0000000000c1', 'Аня')
  on conflict (telegram_id) do update set couple_id = excluded.couple_id;

-- New tables are reachable only through server functions (service_role); anon gets nothing.
alter table app_users enable row level security;
alter table invites   enable row level security;

-- NOTE: ideas/shopping RLS lockdown (revoking the open anon policies) is applied in the
-- switchover step, together with the deployed db-proxy — applying it now would break the
-- current app, which still reads via the anon key. Kept separate on purpose.
