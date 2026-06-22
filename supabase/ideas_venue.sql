-- Together — add venue (out / home) so home dates are distinct from outings. Run once in Supabase → SQL Editor.
alter table ideas add column if not exists venue text not null default 'out' check (venue in ('out','home'));
