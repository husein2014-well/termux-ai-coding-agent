import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';

const digest = async (value) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map((b) => b.toString(16).padStart(2, '0')).join('');
function fakeDb(existingHash = '') {
  const writes = [];
  return {
    writes,
    prepare(sql) {
      return { sql, bind(...params) { return { sql, params, async first() { return params[0] === existingHash ? { telegram_id: '123', expires_at: '2099-01-01 00:00:00' } : null; }, async run() { writes.push({ sql, params }); return { success: true }; } }; } };
    },
    async batch(statements) { for (const statement of statements) writes.push({ sql: statement.sql, params: statement.params }); return []; },
  };
}

const makeRequest = (path, method = 'GET', body, headers = {}) => new Request(`https://test.workers.dev${path}`, { method, headers: body ? { 'content-type': 'application/json', ...headers } : headers, body: body ? JSON.stringify(body) : undefined });

test('health route reports service status', async () => {
  const response = await worker.fetch(makeRequest('/health'), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, 'termux-ai-login');
});

test('validation accepts only a matching active key hash', async () => {
  const key = `TAI_${'a'.repeat(44)}`;
  const db = fakeDb(await digest(key));
  const response = await worker.fetch(makeRequest('/v1/auth/validate', 'POST', { key }), { DB: db });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).valid, true);
  const invalid = await worker.fetch(makeRequest('/v1/auth/validate', 'POST', { key: 'wrong-key-long-enough-123456' }), { DB: db });
  assert.equal(invalid.status, 401);
});

test('Telegram webhook rejects requests without the configured secret header', async () => {
  const env = { DB: fakeDb(), TELEGRAM_BOT_TOKEN: 'not-used', TELEGRAM_WEBHOOK_SECRET: 'correct-secret', TELEGRAM_WEBHOOK_PATH: 'random-path' };
  const response = await worker.fetch(makeRequest('/telegram/random-path', 'POST', {}), env);
  assert.equal(response.status, 401);
});

test('private /key issues raw key once but stores only its SHA-256 digest', async (t) => {
  const originalFetch = globalThis.fetch;
  let botMessage;
  globalThis.fetch = async (_url, init) => {
    botMessage = JSON.parse(init.body);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const db = fakeDb();
  const env = { DB: db, TELEGRAM_BOT_TOKEN: 'test-bot-token', TELEGRAM_WEBHOOK_SECRET: 'correct-secret', TELEGRAM_WEBHOOK_PATH: 'random-path' };
  const update = { message: { text: '/key', chat: { id: 123, type: 'private' }, from: { id: 123, username: 'testuser', first_name: 'Test' } } };
  const response = await worker.fetch(makeRequest('/telegram/random-path', 'POST', update, { 'X-Telegram-Bot-Api-Secret-Token': 'correct-secret' }), env);
  assert.equal(response.status, 200);
  assert.match(botMessage.text, /TAI_[A-Za-z0-9_-]+/);
  assert.equal(botMessage.chat_id, 123);
  const issuedKey = botMessage.text.match(/TAI_[A-Za-z0-9_-]+/)[0];
  assert.equal(db.writes.length, 2);
  assert.equal(db.writes[1].params[0], '123');
  assert.equal(db.writes[1].params[1], await digest(issuedKey));
  assert.notEqual(db.writes[1].params[1], issuedKey);
});
