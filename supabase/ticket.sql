-- Together — PDF/скрин билета на идею/событие. Безопасно для боевой БД.
-- Хранится ПУТЬ в приватном Storage-бакете 'tickets' (URL подписывается на лету).
alter table ideas add column if not exists ticket text;
