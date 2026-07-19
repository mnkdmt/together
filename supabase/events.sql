-- Together — аналитика: журнал событий (DAU/MAU/воронка). Безопасно для боевой БД.
-- Пишется только сервером (service_role); RLS включён без политик → анон не видит ничего.
create table if not exists events (
  id bigint generated always as identity primary key,
  couple_id uuid,
  tid bigint,
  name text not null,
  props jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists events_created on events (created_at);
create index if not exists events_name_created on events (name, created_at);
alter table events enable row level security;
