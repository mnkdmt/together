-- Together — notify Anya when Dmitry checks off her shopping items (run once in Supabase → SQL Editor).
-- Adds a `notified` flag so each completed item pings her exactly once, and survives bot restarts.
alter table shopping add column if not exists notified boolean not null default false;

-- Backfill: don't spam about items that were already bought before this feature existed.
update shopping set notified = true where done = true;
