// Together — scheduled function: ping Anya when Dmitry checks off something she asked to buy.
// Runs every minute. Idempotent via the `notified` flag, so it never double-sends and
// catches anything checked between runs. Env: BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, COUPLE_ID, ANYA_ID.
import { Bot } from 'grammy';
import { createClient } from '@supabase/supabase-js';

const { BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, COUPLE_ID, ANYA_ID } = process.env;
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const bot = new Bot(BOT_TOKEN);

const buyVerb = (theme) => (theme === 'other' ? 'сделал' : 'купил');

export default async () => {
  const { data, error } = await supa.from('shopping')
    .select('id,text,theme')
    .eq('couple_id', COUPLE_ID).eq('author', 'she').eq('done', true).eq('notified', false);
  if (error) { console.error('notify query failed:', error.message); return new Response('query error', { status: 500 }); }
  if (!data || !data.length) return new Response('nothing to notify');

  const msg = data.length === 1
    ? `💛 Дима ${buyVerb(data[0].theme)}: «${data[0].text}»`
    : `💛 Дима выполнил из твоего списка:\n` + data.map((r) => `• ${r.text}`).join('\n');
  try {
    await bot.api.sendMessage(ANYA_ID || '344423348', msg);
    await supa.from('shopping').update({ notified: true }).in('id', data.map((r) => r.id));
    console.log(`notified Anya about ${data.length} purchase(s)`);
  } catch (e) {
    console.error('notify send failed:', e.message); // leave notified=false → retried next run
  }
  return new Response('ok');
};

// Every minute (Netlify cron, UTC). Minimum granularity is 1 minute.
export const config = { schedule: '* * * * *' };
