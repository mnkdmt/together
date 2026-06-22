# Together — Telegram bot

Receives forwarded links (from her), pulls the og:image + title, asks intensity with
three buttons, and writes the idea into Supabase. The PWA reads it from there.

## Setup

1. **Create the bot** — message [@BotFather](https://t.me/BotFather) → `/newbot` →
   copy the token.
2. **Create a Supabase project** at supabase.com, then run `../supabase/schema.sql`
   in the SQL Editor. Note the printed `couple_id`.
3. **Fill env**:
   ```sh
   cd bot
   cp .env.example .env
   # edit .env: BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY (service_role), COUPLE_ID
   ```
   Get keys from Supabase → Project Settings → API. Use the **service_role** key here
   (server-side only — it bypasses RLS; never put it in the frontend).
   Optionally set `ALLOWED_USER_IDS` (yours + hers, from @userinfobot) to keep the bot private.
4. **Run**:
   ```sh
   npm install
   npm start
   ```
5. In Telegram, send the bot `/start`, then forward it a link. It should reply with the
   three intensity buttons and the idea should appear in the app.

Long-polling, no public URL needed — runs fine on your laptop or any small server.
To productionize later, switch to a Supabase Edge Function webhook.
