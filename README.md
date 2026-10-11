# Termux AI Coding Assistant

CLI AI coding untuk Termux yang menggabungkan pengalaman tanya-jawab dan bantuan kode bergaya Blackbox AI dengan konteks project dan usulan edit bergaya Cursor. Mendukung endpoint chat-completions OpenAI-compatible (contoh: OpenRouter, OpenAI, atau endpoint sendiri) dan bisa meneruskan sesi ke Hermes Agent yang sudah terpasang.

> Ini proyek komunitas independen, bukan produk resmi Blackbox AI, Cursor, atau Nous Research. Anda perlu API key/model sendiri; biaya penggunaan provider, bila ada, ditagihkan oleh provider.

## Instalasi di Termux dari GitHub

Pasang aplikasi Termux dari sumber resminya, lalu jalankan:

```sh
pkg update
pkg install -y git python
curl -fsSL https://raw.githubusercontent.com/husein2014-well/termux-ai-coding-agent/main/install.sh | bash
termux-ai setup
```

Installer meng-clone source ke `~/.local/share/termux-ai-coding-agent` dan membuat perintah `termux-ai`. Tidak memerlukan root atau paket Python pihak ketiga. Setup meminta provider, base URL, model, dan API key secara interaktif. API key disimpan di `~/.config/termux-ai/config.json` dengan permission terbatas, tidak masuk ke repository.

Contoh OpenRouter: base URL `https://openrouter.ai/api/v1`, model yang tersedia di akun Anda (misalnya `openai/gpt-4o-mini`). Model/provider dapat berubah; periksa katalog provider Anda.

## Perintah

```sh
termux-ai setup
termux-ai chat
termux-ai ask "Jelaskan fungsi file ini" --file app.py
termux-ai review ./src
termux-ai edit app.py "Tambahkan validasi input"
termux-ai config
```

Perintah `edit` menampilkan diff dan **tidak menulis perubahan sampai Anda menjawab `y`**. Perintah `review` membaca file teks project (mengabaikan `.git`, `node_modules`, virtualenv, dan cache), maksimal 12 file per folder dan 100.000 karakter konteks. Jangan sertakan rahasia seperti `.env` atau API key dalam konteks yang dikirim ke layanan model.

### Hermes Agent

Jika perintah `hermes` telah tersedia, semua argumen dapat diteruskan:

```sh
termux-ai hermes --help
termux-ai hermes
```

Hermes adalah proyek upstream terpisah; installer ini tidak menginstalnya. Dokumentasi upstream menyediakan paket APT khusus Termux untuk perangkat ARM64, tetapi dokumentasi tersebut saat ini menyatakan paket Termux sedang mengalami masalah. Ikuti status dan instruksi terbaru di [panduan resmi Hermes untuk Termux](https://hermes-agent.nousresearch.com/docs/getting-started/termux); jangan gunakan installer desktop/server mereka di Android.

## Keamanan & catatan

- CLI mengirim prompt dan konteks file yang dipilih ke endpoint provider yang Anda setel.
- File config berisi API key dan hanya dapat dibaca pemilik pada sistem yang mendukung permission POSIX.
- Jangan gunakan `edit` pada file penting tanpa memeriksa diff dan membuat backup/commit.
- API provider mesti mendukung `POST /chat/completions` serta format respons OpenAI-compatible.
- Aplikasi ini belum menjalankan shell command/code autonomously. Ia memberi jawaban dan usulan edit yang Anda setujui sendiri.
- Blackbox AI dan Cursor adalah merek dagang pemiliknya masing-masing; integrasi resmi proprietary mereka tidak diklaim.

## Lisensi

MIT. Lihat [LICENSE](LICENSE).
