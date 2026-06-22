-- Together — shopping list table (run once in Supabase → SQL Editor)
create table if not exists shopping (
  id          bigint generated always as identity primary key,
  couple_id   uuid not null references couples(id) on delete cascade,
  text        text not null,
  theme       text not null default 'other' check (theme in ('food','market','other')),
  done        boolean not null default false,
  author      text not null default 'she' check (author in ('she','me')),
  created_at  timestamptz default now()
);
create index if not exists shopping_couple_idx on shopping(couple_id, done);

alter table shopping enable row level security;
drop policy if exists "anon all shopping" on shopping;
create policy "anon all shopping" on shopping for all to anon using (true) with check (true);
