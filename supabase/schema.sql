-- Together — Supabase schema (v1)
-- Personal couple's app: she forwards links to the Telegram bot → ideas land here;
-- he triages in the PWA, plans, and logs "done" memories.
-- Run this in Supabase → SQL Editor.

create extension if not exists "pgcrypto";

-- one couple (personal app = a single row)
create table if not exists couples (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  created_at  timestamptz default now()
);

-- every idea/plan/memory is a row in ideas, distinguished by status
create table if not exists ideas (
  id            bigint generated always as identity primary key,
  couple_id     uuid not null references couples(id) on delete cascade,
  title         text not null,
  url           text,
  og_image      text,
  category      text,                                   -- concert|food|trip|home|bar|walk|film|null
  price         text,
  location      text,
  note          text,                                   -- her quote
  author        text not null default 'she'  check (author in ('she','me')),
  intensity     text not null default 'interesting' check (intensity in ('want','interesting','someday')),
  status        text not null default 'idea' check (status in ('idea','planned','done')),
  planned_date  date,
  planned_time  text,
  done_photos   text[] default '{}',
  mood          text,
  created_at    timestamptz default now()
);

create index if not exists ideas_couple_status_idx on ideas(couple_id, status);

-- ─── Row Level Security ───────────────────────────────────────────────
-- MVP (personal, no auth yet): the bot writes with the service_role key (bypasses RLS).
-- The PWA reads/updates with the anon key. Policies below are intentionally loose.
-- ⚠️ TODO before any public exposure: add Supabase Auth (magic-link, 2 allowed emails)
--    and scope every policy to the authed user's couple_id.
alter table couples enable row level security;
alter table ideas   enable row level security;

drop policy if exists "anon read couples" on couples;
create policy "anon read couples" on couples for select to anon using (true);

drop policy if exists "anon read ideas" on ideas;
create policy "anon read ideas"   on ideas for select to anon using (true);

drop policy if exists "anon update ideas" on ideas;
create policy "anon update ideas" on ideas for update to anon using (true) with check (true);

-- the bot inserts with the anon key too (MVP — gated by the bot's Telegram allowlist)
drop policy if exists "anon insert ideas" on ideas;
create policy "anon insert ideas" on ideas for insert to anon with check (true);

-- ─── Seed the couple ──────────────────────────────────────────────────
insert into couples (id, name)
values ('00000000-0000-0000-0000-0000000000c1', 'Дима и Аня')
on conflict (id) do nothing;

-- After running: copy this couple id into bot/.env (COUPLE_ID) and config.js (coupleId).
select 'couple_id =' as label, id from couples;
