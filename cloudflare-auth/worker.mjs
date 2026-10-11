const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
const digest = async (value) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return 'TAI_' + btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
async function telegramSend(env, chatId, text) {
  const response = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, protect_content: true }),
  });
  if (!response.ok) throw new Error('Telegram API returned ' + response.status);
}
async function handleTelegram(request, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET || !env.TELEGRAM_WEBHOOK_PATH || !env.DB) return json({ error: 'Bot is not configured' }, 503);
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'Unauthorized' }, 401);
  const update = await request.json();
  const message = update.message;
  if (!message?.text || !message.from?.id || !message.chat?.id || message.chat.type !== 'private') return json({ ok: true });
  const command = message.text.trim().split(/\s+/, 1)[0].split('@', 1)[0].toLowerCase();
  if (command === '/start') {
    await telegramSend(env, message.chat.id, 'Termux AI login key bot. Gunakan /key untuk membuat key login. Key berlaku 365 hari, ditampilkan sekali, dan key baru menggantikan key lama. Gunakan /revoke untuk mencabut key.');
    return json({ ok: true });
  }
  if (command === '/revoke') {
    await env.DB.prepare('UPDATE access_keys SET revoked_at = CURRENT_TIMESTAMP WHERE telegram_id = ? AND revoked_at IS NULL').bind(String(message.from.id)).run();
    await telegramSend(env, message.chat.id, 'Key login Anda telah dicabut. Jalankan /key untuk menerbitkan key baru.');
    return json({ ok: true });
  }
  if (command !== '/key') return json({ ok: true });
  const telegramId = String(message.from.id);
  const lastIssue = await env.DB.prepare('SELECT created_at FROM access_keys WHERE telegram_id = ?').bind(telegramId).first();
  if (lastIssue?.created_at && Date.now() - Date.parse(lastIssue.created_at.replace(' ', 'T') + 'Z') < 60000) {
    await telegramSend(env, message.chat.id, 'Tunggu satu menit sebelum meminta atau mengganti key lagi.');
    return json({ ok: true });
  }
  const key = randomKey();
  const keyHash = await digest(key);
  const insertUser = env.DB.prepare('INSERT INTO telegram_users (telegram_id) VALUES (?) ON CONFLICT(telegram_id) DO UPDATE SET updated_at=CURRENT_TIMESTAMP').bind(telegramId);
  const saveKey = env.DB.prepare("INSERT INTO access_keys (telegram_id, key_hash, expires_at) VALUES (?, ?, datetime('now', '+365 days')) ON CONFLICT(telegram_id) DO UPDATE SET key_hash=excluded.key_hash, created_at=CURRENT_TIMESTAMP, expires_at=datetime('now', '+365 days'), revoked_at=NULL").bind(telegramId, keyHash);
  await env.DB.batch([insertUser, saveKey]);
  await telegramSend(env, message.chat.id, 'Key login Anda (berlaku 365 hari; tampil sekali):\n\n' + key + '\n\nMasukkan di Termux dengan: termux-ai login\nJangan bagikan key ini. Jika meminta /key lagi, key sebelumnya langsung tidak berlaku.');
  return json({ ok: true });
}
async function validateKey(request, env) {
  if (!env.DB) return json({ error: 'Auth database is not configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ valid: false }, 400); }
  if (typeof body.key !== 'string' || body.key.length < 20 || body.key.length > 128) return json({ valid: false }, 400);
  const keyHash = await digest(body.key);
  const row = await env.DB.prepare('SELECT telegram_id, expires_at FROM access_keys WHERE key_hash = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP LIMIT 1').bind(keyHash).first();
  return json(row ? { valid: true, expires_at: row.expires_at } : { valid: false }, row ? 200 : 401);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, service: 'termux-ai-login' });
    if (request.method === 'POST' && url.pathname === '/v1/auth/validate') return validateKey(request, env);
    const expectedPath = env.TELEGRAM_WEBHOOK_PATH ? '/telegram/' + env.TELEGRAM_WEBHOOK_PATH : '';
    if (request.method === 'POST' && expectedPath && url.pathname === expectedPath) {
      try { return await handleTelegram(request, env); }
      catch { return json({ error: 'Webhook processing failed' }, 500); }
    }
    return json({ error: 'Not found' }, 404);
  },
};
