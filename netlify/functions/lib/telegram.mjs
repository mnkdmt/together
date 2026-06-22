// Verify a Telegram Mini App initData string (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
// Returns the parsed `user` object when the signature is valid and fresh, otherwise null.
import crypto from 'node:crypto';

export function verifyInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // constant-time compare
  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  // freshness (block replay of very old initData)
  const authDate = Number(params.get('auth_date') || 0);
  if (maxAgeSeconds && authDate && Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  const userRaw = params.get('user');
  try { return userRaw ? JSON.parse(userRaw) : {}; } catch { return null; }
}
