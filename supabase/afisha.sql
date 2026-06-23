-- Together — Afisha (KudaGo) integration, Phase A. Safe to run on the live DB.
-- Liked KudaGo events are stored as normal ideas (source='afisha', liked=true),
-- so they flow through the same list → plan → "Было" lifecycle.

alter table ideas   add column if not exists source  text default 'manual';   -- manual | bot | afisha
alter table ideas   add column if not exists liked   boolean default false;
alter table ideas   add column if not exists ext_id  text;                     -- e.g. 'kudago:12345' (dedup)
alter table ideas   add column if not exists lat     double precision;
alter table ideas   add column if not exists lon     double precision;
create index if not exists ideas_couple_ext on ideas (couple_id, ext_id);

alter table couples add column if not exists city    text default 'msk';       -- KudaGo location slug
