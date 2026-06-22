// Together — couple-scoped data proxy (Vercel). Identity = verified Telegram initData;
// every operation is restricted to the caller's own couple. Also fires purchase notifications
// inline (event-driven) when a shopping item is checked off — no cron needed.
import { createClient } from '@supabase/supabase-js';
import { verifyInitData } from '../lib/telegram.mjs';

const { BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
const TABLES = { ideas: true, shopping: true };

const tg = (method, payload) =>
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    .then((r) => r.json()).catch(() => null);

// First-time users get their own fresh couple-of-one.
async function resolveCouple(u) {
  const existing = await svc.from('app_users').select('couple_id').eq('telegram_id', u.id).maybeSingle();
  if (existing.data && existing.data.couple_id) return existing.data.couple_id;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Моя пара';
  const c = await svc.from('couples').insert({ name }).select('id').single();
  if (c.error) throw new Error('couple create: ' + c.error.message);
  await svc.from('app_users').upsert({ telegram_id: u.id, couple_id: c.data.id, name, photo_url: u.photo_url || null });
  return c.data.id;
}

// When a shopping item is marked done, tell the other member(s) of the couple.
async function notifyPartner(couple_id, actor) {
  const { data } = await svc.from('shopping').select('id,text').eq('couple_id', couple_id).eq('done', true).eq('notified', false);
  if (!data || !data.length) return;
  const ids = data.map((r) => r.id);
  const members = await svc.from('app_users').select('telegram_id').eq('couple_id', couple_id).neq('telegram_id', actor.id);
  const who = actor.first_name || 'Партнёр';
  const msg = data.length === 1
    ? `💛 ${who} купил: «${data[0].text}»`
    : `💛 ${who} выполнил из списка:\n` + data.map((r) => `• ${r.text}`).join('\n');
  for (const m of (members.data || [])) await tg('sendMessage', { chat_id: m.telegram_id, text: msg });
  await svc.from('shopping').update({ notified: true }).in('id', ids); // mark even if no partner, to avoid buildup
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const body = req.body || {};

  const user = verifyInitData(body.initData, BOT_TOKEN);
  if (!user || !user.id) return res.status(401).json({ error: 'unauthorized' });

  const { table, action, values, match, select, single, order } = body;
  if (!TABLES[table]) return res.status(400).json({ error: 'bad table' });

  let couple_id;
  try { couple_id = await resolveCouple(user); } catch (e) { return res.status(500).json({ error: e.message }); }

  let q;
  if (action === 'select') {
    q = svc.from(table).select(select || '*').eq('couple_id', couple_id);
    if (order) q = q.order(order.col, { ascending: order.asc !== false });
  } else if (action === 'insert') {
    const rows = (Array.isArray(values) ? values : [values]).map((v) => ({ ...v, couple_id }));
    q = svc.from(table).insert(rows);
    if (select) q = q.select(select);
  } else if (action === 'update' || action === 'delete') {
    q = svc.from(table)[action](action === 'update' ? values : undefined).eq('couple_id', couple_id);
    for (const [k, v] of Object.entries(match || {})) q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
  } else {
    return res.status(400).json({ error: 'bad action' });
  }
  if (single) q = q.single();

  const { data, error } = await q;

  if (!error && table === 'shopping' && action === 'update') {
    try { await notifyPartner(couple_id, user); } catch (e) { /* notify best-effort */ }
  }
  return res.status(200).json({ data: data ?? null, error: error ? error.message : null });
}
