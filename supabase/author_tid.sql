-- Together — точное авторство идей: telegram_id отправителя (вместо хардкода 'she'/'me',
-- который в чужих парах всегда показывал «добавила Аня»). Безопасно для боевой БД.
alter table ideas add column if not exists author_tid bigint;
