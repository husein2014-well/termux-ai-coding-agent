# Layanan key login Telegram (Cloudflare Workers + D1)

## Infrastruktur proyek yang sudah disiapkan

- Worker: `termux-ai-login`
- URL: <https://termux-ai-login.xtc7418.workers.dev>
- Health check: <https://termux-ai-login.xtc7418.workers.dev/health>
- D1: `termux-ai-login`; schema sudah diterapkan.
- Source: `worker.mjs`; binding D1 dan webhook path sudah dikonfigurasi di `wrangler.toml`.

Worker dan database sudah aktif, tetapi bot **belum dapat menerbitkan key** sampai pemilik membuat bot di Telegram dan menyetel rahasia di Cloudflare. Endpoint Telegram menolak request tanpa `TELEGRAM_WEBHOOK_SECRET`; endpoint penerbitan `/key` belum berfungsi sebelum token bot disetel.

## Aktivasi bot satu kali oleh pemilik

1. Buka [@BotFather](https://t.me/BotFather), jalankan `/newbot`, pilih nama dan username bot, lalu simpan token yang diberikannya. **Jangan masukkan token ke chat atau commit ke Git.**
2. Buat webhook secret acak secara lokal:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

3. Cloudflare Dashboard → **Workers & Pages → `termux-ai-login` → Settings → Variables and Secrets**. Tambahkan dua nilai sebagai **Secret** (bukan plain text):
   - `TELEGRAM_BOT_TOKEN`: nilai dari BotFather.
   - `TELEGRAM_WEBHOOK_SECRET`: nilai acak dari langkah sebelumnya.

   Simpan perubahan dengan **Save and deploy**.
4. Dari clone repo (installer CLI sudah meng-clone ke `~/.local/share/termux-ai-coding-agent`), jalankan helper. Masukkan token dan webhook secret saat diminta; keduanya tidak ditampilkan, disimpan, atau ditaruh dalam argumen shell:

   ```sh
   cd ~/.local/share/termux-ai-coding-agent/cloudflare-auth
   node setup-telegram-webhook.mjs
   ```

5. Cari bot berdasarkan username yang dipilih di BotFather. Di **private chat** kirim `/start`, lalu `/key`.

## Bot commands

- `/start`: petunjuk singkat.
- `/key`: membuat key login acak 256-bit dengan masa berlaku 365 hari. Key ditampilkan sekali; permintaan ulang setelah jeda 60 detik mengganti dan mencabut key lama.
- `/revoke`: mencabut key aktif.

Bot hanya memproses pesan private. D1 hanya menyimpan Telegram ID dan hash SHA-256 key; raw key tidak disimpan di backend. Worker memeriksa header rahasia webhook Telegram.

## API

- `GET /health`: health check.
- `POST /v1/auth/validate` body `{"key":"TAI_..."}`: respons `{valid:true, expires_at}` untuk key aktif, atau HTTP 401.

## CLI

Key login tidak menggantikan API key model. Di Termux, minta `/key` dari bot, lalu jalankan `termux-ai login`; masukkan key saat diminta. CLI menyimpan key di `~/.config/termux-ai/login.json` dengan mode `0600` dan memvalidasinya melalui HTTPS untuk setiap panggilan AI. Perintah `termux-ai login status` memeriksa status remote; `termux-ai login logout` menghapus sesi lokal. API key provider tetap diatur terpisah lewat `termux-ai setup`.

## Redeploy / penggunaan di akun Cloudflare lain

`wrangler.toml` menunjuk ke database dan Worker akun pemilik proyek ini. Untuk redeploy pada akun yang sama:

```sh
npx wrangler d1 migrations apply termux-ai-login --remote
npx wrangler deploy
```

Untuk akun lain, buat database D1 baru dan ganti `database_id` pada `wrangler.toml`, lalu deploy Worker dan aktifkan workers.dev. Jangan commit token bot, webhook secret, `.dev.vars`, atau file credential Wrangler.

## Batas akses

Mode saat ini **self-service**: siapa pun yang menemukan username bot dapat meminta key. Sebelum membagikan bot secara luas, pemilik dapat menambahkan allowlist Telegram/admin approval bila akses harus terbatas. Proyek CLI bersifat open source sehingga kontrol login ini bukan mekanisme DRM tahan bypass.
