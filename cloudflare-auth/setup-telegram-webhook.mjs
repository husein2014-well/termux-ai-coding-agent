import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKER_URL = 'https://termux-ai-login.xtc7418.workers.dev';
const HERE = path.dirname(fileURLToPath(import.meta.url));

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Jalankan helper ini langsung di terminal interaktif agar input rahasia tidak terlihat.'));
  }
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    let value = '';
    const finish = (result, error) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(Boolean(wasRaw));
      process.stdout.write('\n');
      if (error) reject(error); else resolve(result.trim());
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') return finish('', new Error('Dibatalkan.'));
        if (char === '\r' || char === '\n') return finish(value);
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const config = fs.readFileSync(path.join(HERE, 'wrangler.toml'), 'utf8');
  const match = config.match(/^TELEGRAM_WEBHOOK_PATH\s*=\s*"([A-Za-z0-9_-]+)"/m);
  if (!match) throw new Error('TELEGRAM_WEBHOOK_PATH tidak ditemukan di wrangler.toml.');
  const webhookUrl = WORKER_URL + '/telegram/' + match[1];
  console.log('Sebelum lanjut, pastikan Cloudflare Worker memiliki secrets TELEGRAM_BOT_TOKEN dan TELEGRAM_WEBHOOK_SECRET.');
  const botToken = await readHidden('Token bot dari @BotFather (input disembunyikan): ');
  const webhookSecret = await readHidden('TELEGRAM_WEBHOOK_SECRET yang sama dengan Cloudflare (input disembunyikan): ');
  if (!botToken || !/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) throw new Error('Token bot kosong atau format webhook secret tidak valid.');
  const body = new URLSearchParams({
    url: webhookUrl,
    secret_token: webhookSecret,
    allowed_updates: JSON.stringify(['message']),
  });
  let response;
  try {
    response = await fetch('https://api.telegram.org/bot' + botToken + '/setWebhook', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body,
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) { throw new Error('Tidak dapat menghubungi Telegram: ' + error.message); }
  let result;
  try { result = await response.json(); } catch { throw new Error('Respons Telegram tidak valid.'); }
  if (!response.ok || result.ok !== true) throw new Error('Telegram menolak pendaftaran webhook; periksa token bot dan coba lagi.');
  console.log('Webhook bot berhasil dipasang ke: ' + webhookUrl);
  console.log('Token dan webhook secret tidak disimpan oleh helper ini. Simpan secret di Cloudflare Worker Secrets.');
}

main().catch((error) => { console.error('Gagal memasang webhook: ' + error.message); process.exitCode = 1; });
