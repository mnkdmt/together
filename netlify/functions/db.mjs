// Together — couple-scoped data proxy. The Mini App sends its Telegram initData with every
// request; we verify it, resolve which couple the user belongs to (auto-provisioning a fresh
// couple on first open), and run the operation scoped to that couple_id via the service role.
// This is what makes the app multi-tenant: a user can only ever touch their own couple's rows.
import { createClient } from '@supabase/supabase-js';
import { verifyInitData } from './lib/telegram.mjs';

const { BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

const TABLES = { ideas: true, shopping: true };           // only these are reachable
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// Ensure the user has a couple; first-time users get their own fresh (couple-of-one) space.
async function resolveCouple(u) {
  const existing = await svc.from('app_users').select('couple_id').eq('telegram_id', u.id).maybeSingle();
  if (existing.data && existing.data.couple_id) return existing.data.couple_id;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Моя пара';
  const c = await svc.from('couples').insert({ name }).select('id').single();
  if (c.error) throw new Error('couple create: ' + c.error.message);
  await svc.from('app_users').upsert({ telegram_id: u.id, couple_id: c.data.id, name, photo_url: u.photo_url || null });
  return c.data.id;
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

  const user = verifyInitData(body.initData, BOT_TOKEN);
  if (!user || !user.id) return json({ error: 'unauthorized' }, 401);

  const { table, action, values, match, select, single, order } = body;
  if (!TABLES[table]) return json({ error: 'bad table' }, 400);

  let couple_id;
  try { couple_id = await resolveCouple(user); }
  catch (e) { return json({ error: e.message }, 500); }

  let q;
  if (action === 'select') {
    q = svc.from(table).select(select || '*').eq('couple_id', couple_id);
    if (order) q = q.order(order.col, { ascending: order.asc !== false });
  } else if (action === 'insert') {
    const rows = (Array.isArray(values) ? values : [values]).map(v => ({ ...v, couple_id }));
    q = svc.from(table).insert(rows);
    if (select) q = q.select(select);
  } else if (action === 'update' || action === 'delete') {
    q = svc.from(table)[action](action === 'update' ? values : undefined).eq('couple_id', couple_id);
    for (const [k, v] of Object.entries(match || {})) q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
  } else {
    return json({ error: 'bad action' }, 400);
  }
  if (single) q = q.single();

  const { data, error } = await q;
  return json({ data: data ?? null, error: error ? error.message : null });
};

export const config = { path: '/db' };
