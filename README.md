# Together

Личное приложение для пары: она пересылает идеи свиданий Telegram-боту → он разбирает
список, планирует и отмечает «было». Тёмный Apple Liquid Glass, PWA.

```
together/
├── index.html              # PWA (frontend, no build step)
├── manifest.webmanifest
├── sw.js                   # service worker (network-first)
├── config.example.js       # → copy to config.js with your Supabase keys
├── supabase/schema.sql     # run in Supabase SQL Editor
├── bot/                    # Telegram bot (Node + grammY)
└── DESIGN_SYSTEM.md        # handoff spec (16 screens, tokens)
```

## Запуск фронта
```sh
python3 -m http.server 4178 --directory .
# открой http://localhost:4178
```
Без `config.js` приложение работает на встроенных mock-данных. С `config.js`
(Supabase URL + anon key + couple_id) — тянет реальные идеи из БД.

## Подключить бэкенд
1. Supabase проект → выполни `supabase/schema.sql`, запиши `couple_id`.
2. `cp config.example.js config.js` → впиши `url`, `anonKey` (anon/public), `coupleId`.
3. Подними бота: см. `bot/README.md` (@BotFather токен + service_role ключ).

## Статус
Готов фронт (все экраны + lifecycle идея→план→было), схема БД, бот.
TODO: Supabase Auth (magic-link) перед публичностью; загрузка фото в Storage;
состояния импорта (loading/error).
