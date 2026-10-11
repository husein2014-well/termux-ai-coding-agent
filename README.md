# Termux AI Coding Assistant

CLI asisten coding untuk Android Termux yang ditulis dalam **JavaScript dan berjalan dengan Node.js**. Menggabungkan pengalaman tanya-jawab dan bantuan kode bergaya Blackbox AI dengan konteks project dan usulan edit bergaya Cursor. Mendukung endpoint chat-completions OpenAI-compatible (misalnya OpenRouter, OpenAI, atau endpoint sendiri) serta dapat meneruskan argumen ke Hermes Agent yang sudah terpasang.

> Ini proyek komunitas independen, bukan produk resmi Blackbox AI, Cursor, atau Nous Research. Anda perlu API key/model sendiri; biaya penggunaan provider, bila ada, ditagihkan oleh provider.

## Instalasi di Termux dari GitHub

Di aplikasi Termux, jalankan:

```sh
pkg update
pkg install -y git nodejs-lts
curl -fsSL https://raw.githubusercontent.com/husein2014-well/termux-ai-coding-agent/main/install.sh | bash
termux-ai setup
```

Installer meng-clone source JavaScript ke `~/.local/share/termux-ai-coding-agent` dan membuat perintah `termux-ai`. Tidak membutuhkan Python atau paket npm tambahan. Setup meminta provider, base URL, model, dan API key secara interaktif. API key disimpan di `~/.config/termux-ai/config.json` dengan permission terbatas, tidak masuk ke repository.

Contoh OpenRouter: base URL `https://openrouter.ai/api/v1`, model yang tersedia di akun Anda (misalnya `openai/gpt-4o-mini`). Model/provider dapat berubah; periksa katalog provider Anda.

## Perintah

```sh
termux-ai setup
termux-ai chat
termux-ai ask "Jelaskan fungsi file ini" --file app.js
termux-ai review ./src
termux-ai edit app.js "Tambahkan validasi input"
termux-ai config
```

`edit` menampilkan usulan diff dan **tidak menulis perubahan sampai Anda menjawab `y`**. `review` membaca file teks project, mengabaikan `.git`, `node_modules`, virtualenv, dan cache; batasnya 12 file per folder dan 100.000 karakter konteks. File yang tampak rahasia (`.env`, kunci privat, dan nama berisi `secret`/`credential`) dikecualikan. Hindari mengirim informasi sensitif ke layanan model.

### Hermes Agent

Jika perintah `hermes` tersedia, argumen dapat diteruskan dengan `termux-ai hermes --help` atau `termux-ai hermes`. Hermes adalah proyek upstream terpisah; installer ini tidak memasangnya. Dokumentasi upstream menyediakan paket APT khusus Termux untuk perangkat ARM64, tetapi saat ini menyatakan paket Termux sedang mengalami masalah. Ikuti status dan instruksi terbaru di [panduan resmi Hermes untuk Termux](https://hermes-agent.nousresearch.com/docs/getting-started/termux); jangan gunakan installer desktop/server mereka di Android.

## Keamanan & catatan

- CLI mengirim prompt dan konteks file yang dipilih ke endpoint provider yang Anda setel.
- File config berisi API key dan permission file dibatasi pada sistem yang mendukung permission POSIX.
- Periksa diff dan buat backup/commit sebelum mengubah file penting.
- Provider harus mendukung `POST /chat/completions` dan format respons OpenAI-compatible.
- Aplikasi ini tidak menjalankan shell command/code secara otomatis; ia memberi jawaban dan usulan edit yang Anda setujui sendiri.

## Pengembangan

Tidak ada dependensi eksternal. Jalankan tes bawaan Node.js:

```sh
node --test
```

## Lisensi

MIT. Lihat [LICENSE](LICENSE).
