// Together — Telegram bot as a Netlify webhook function (always-on, no laptop).
// Env (set in Netlify → Site settings → Environment variables):
//   BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, COUPLE_ID, ALLOWED_USER_IDS, TG_WEBHOOK_SECRET
import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import { extractEvent, MONTH_NAMES } from '../../bot/extract.mjs';

const { BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, COUPLE_ID, ALLOWED_USER_IDS, TG_WEBHOOK_SECRET } = process.env;

const allowed = (ALLOWED_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const ME_ID = process.env.ME_USER_ID || '681332519'; // Dmitry — his forwards are authored 'me', everyone else 'she'
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const bot = new Bot(BOT_TOKEN);

const INT = {
  want:        { label: 'очень хочу 🔥' },
  interesting: { label: 'интересно 🔖' },
  someday:     { label: 'когда-нибудь 🌙' },
};

bot.use(async (ctx, next) => {
  const uid = String(ctx.from?.id || '');
  if (allowed.length && !allowed.includes(uid)) { await ctx.reply('Этот бот личный 💛'); return; }
  await next();
});

const WELCOME_PHOTO = 'https://frabjous-marzipan-6107d0.netlify.app/icons/welcome.png';
const WELCOME_CAPTION =
  '<b>Together</b> 💛 — ваш личный планировщик свиданий.\n\n' +
  'Кидай сюда:\n' +
  '🔗 <b>ссылку</b> на идею — афишу, фильм, заведение. Добавлю в список и спрошу, насколько хочется.\n' +
  '🛒 <b>покупки</b> текстом («молоко, хлеб») — разложу по темам.\n\n' +
  'Всё попадёт в приложение — там вы выберете, чем заняться. ✨';

bot.command('start', async (ctx) => {
  try { await ctx.replyWithPhoto(WELCOME_PHOTO, { caption: WELCOME_CAPTION, parse_mode: 'HTML' }); }
  catch (e) { console.error('start photo failed:', e.message); await ctx.reply(WELCOME_CAPTION.replace(/<\/?b>/g, '')); }
});

bot.on('message:text', async (ctx) => {
  const url = (ctx.message.text.match(/https?:\/\/\S+/) || [])[0];
  const author = String(ctx.from?.id) === ME_ID ? 'me' : 'she';

  // No link → treat as shopping-list item(s)
  if (!url) {
    const items = ctx.message.text.split(/[\n,]+/).map(t => t.trim()).filter(Boolean).slice(0, 20);
    if (!items.length) return;
    const { data, error } = await supa.from('shopping')
      .insert(items.map(t => ({ couple_id: COUPLE_ID, text: t, theme: 'other', author })))
      .select('id');
    if (error) { console.error('shop insert failed:', error); await ctx.reply('Не смог сохранить покупки 😕'); return; }
    const ids = (data || []).map(r => r.id).join('-');
    const kb = new InlineKeyboard()
      .text('🍎 Еда', `sht:food:${ids}`)
      .text('📦 Маркетплейсы', `sht:market:${ids}`).row()
      .text('🧺 Другое', `sht:other:${ids}`);
    await ctx.reply(`В покупки добавлено: ${items.join(', ')}.\nКакая тема?`, { reply_markup: kb });
    return;
  }
  await ctx.replyWithChatAction('typing');

  const ev = await extractEvent(url);

  const { data, error } = await supa.from('ideas').insert({
    couple_id: COUPLE_ID, title: ev.title, url: ev.url, og_image: ev.image,
    location: ev.location, event_date: ev.date, event_time: ev.time,
    author, status: 'idea', intensity: 'interesting',
  }).select('id').single();
  if (error) { console.error('insert failed:', error); await ctx.reply('Ой, не смог сохранить 😕 попробуй ещё раз.'); return; }

  let info = '';
  if (ev.date) { const d = new Date(ev.date + 'T00:00:00'); info += `\n🗓 ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}${ev.time ? ', ' + ev.time : ''}`; }
  if (ev.location) info += `\n📍 ${ev.location}`;

  const kb = new InlineKeyboard()
    .text('🔥 Очень хочу', `int:${data.id}:want`)
    .text('🔖 Интересно', `int:${data.id}:interesting`).row()
    .text('🌙 Когда-нибудь', `int:${data.id}:someday`);
  await ctx.reply(`Добавила: «${ev.title}».${info}\nНасколько хочется?`, { reply_markup: kb });
});

bot.callbackQuery(/^int:(\d+):(want|interesting|someday)$/, async (ctx) => {
  const [, id, intensity] = ctx.match;
  const { error } = await supa.from('ideas').update({ intensity }).eq('id', id);
  if (error) { console.error('update failed:', error); await ctx.answerCallbackQuery({ text: 'Не вышло 😕' }); return; }
  await ctx.editMessageText(`Готово — отметила «${INT[intensity].label}». Уже в вашем списке. 💛`);
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^sht:(food|market|other):(.*)$/, async (ctx) => {
  const [, theme, idsStr] = ctx.match;
  const ids = idsStr.split('-').filter(Boolean);
  if (ids.length) await supa.from('shopping').update({ theme }).in('id', ids);
  const label = { food: 'Еда 🍎', market: 'Маркетплейсы 📦', other: 'Другое 🧺' }[theme];
  await ctx.editMessageText(`Готово — тема «${label}». В вашем списке покупок. 🛒`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => console.error('bot error:', err));

export default webhookCallback(bot, 'std/http', { secretToken: TG_WEBHOOK_SECRET });
export const config = { path: '/bot' };
