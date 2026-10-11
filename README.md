# Termux AI Coding Assistant

CLI asisten coding untuk Android Termux yang ditulis dalam **JavaScript dan Node.js**. Menggabungkan tanya-jawab coding, konteks project, serta edit kode otomatis dengan batas workspace. Mendukung provider chat-completions OpenAI-compatible dan dapat meneruskan argumen ke Hermes Agent yang sudah terpasang.

> Proyek komunitas independen, bukan produk resmi Blackbox AI, Cursor, atau Nous Research. Anda perlu API key/model sendiri; biaya provider, bila ada, ditagihkan oleh provider.

## Instalasi dari GitHub

```sh
pkg update
pkg install -y git nodejs-lts
curl -fsSL https://raw.githubusercontent.com/husein2014-well/termux-ai-coding-agent/main/install.sh | bash
termux-ai setup
```

Installer menyimpan source JavaScript di `~/.local/share/termux-ai-coding-agent`. Tidak membutuhkan Python atau paket npm tambahan. API key disimpan lokal di `~/.config/termux-ai/config.json` dengan permission terbatas.

## Mode otomatis terbatas dan mulai saat boot

Pilih folder proyek. Daemon membatasi baca/tulis file ke folder tersebut:

```sh
termux-ai service start --root ~/projects/nama-project
```

### Aktifkan mulai otomatis

1. Pasang aplikasi **Termux:Boot** dari sumber yang sama dengan aplikasi Termux, lalu buka Termux:Boot sekali. [Petunjuk upstream](https://github.com/termux/termux-boot) menyatakan langkah awal ini diperlukan agar skrip dapat dijalankan saat boot.
2. Di Termux, pasang skrip startup untuk workspace daemon yang sedang aktif:

   ```sh
   termux-ai service boot install
   termux-ai service boot status
   ```

3. Setelah ponsel direstart, periksa dengan `termux-ai service status`.

Matikan mulai otomatis dengan `termux-ai service boot remove`; hentikan daemon dengan `termux-ai service stop`. Skrip tidak mengaktifkan `termux-wake-lock`, jadi Android masih dapat menangguhkan proses saat perangkat tidur atau menerapkan optimasi baterai. Ini tidak menjamin daemon selalu hidup.

### Batas otomatisasi

Saat menerima permintaan coding melalui CLI, AI boleh mengedit otomatis hanya file source berekstensi `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`, `.html`, `.css`, atau `.scss` yang berada di workspace dan bukan file sensitif. Setiap edit membuat salinan sebelumnya di `.termux-ai-backups/` dan menampilkan diff serta lokasi backup. File konfigurasi, dokumen lain, file di luar workspace, path traversal, dan symlink keluar workspace tidak diedit otomatis.

Eksekusi otomatis hanya mengizinkan perintah berikut:

- `git status --short`
- `git diff --check`
- `git diff --stat`
- `git diff --name-only`
- `node --check <file .js/.mjs/.cjs relatif>` — pemeriksaan sintaks, bukan menjalankan program.

`npm test`, `npm install`, `git commit`, perintah shell bebas, atau perintah lain **tidak** termasuk allowlist otomatis. Jika AI mengusulkannya, perintah menunggu persetujuan manual melalui `termux-ai approve <id>`. Perintah manual yang disetujui berjalan dengan izin akun Termux dan secara teknis dapat mengakses file di luar workspace; karena itu tinjau teks perintah sebelum menyetujui.

### Contoh

```sh
termux-ai service start --root ~/projects/my-app
termux-ai ask "Jelaskan struktur aplikasi ini" --file src/app.js
termux-ai review src
termux-ai edit src/app.js "Tambahkan validasi input"
termux-ai command "Periksa syntax src/app.js"
termux-ai service pending
termux-ai service status
```

Daemon mendengarkan hanya pada `127.0.0.1`, memakai token lokal di `~/.config/termux-ai/service.json`, dan tidak meminta root atau izin kamera, mikrofon, lokasi, kontak, maupun SMS. Daemon mulai saat perintah `service start` dipanggil; ia tidak memulai pekerjaan sendiri tanpa permintaan. Termux:Boot hanya memulai ulang daemon dengan workspace yang tersimpan.

## Perintah tanpa daemon

```sh
termux-ai chat
termux-ai ask "Jelaskan kode ini" --file app.js
termux-ai review ./src
termux-ai edit app.js "Tambahkan validasi input"
termux-ai config
```

Tanpa daemon, CLI bekerja langsung pada path yang disebutkan dan pengeditan meminta persetujuan interaktif.

## Hermes Agent

Jika perintah `hermes` tersedia, gunakan `termux-ai hermes --help` atau `termux-ai hermes`. Hermes merupakan proyek upstream terpisah; installer ini tidak memasangnya. Periksa [panduan resmi Hermes untuk Termux](https://hermes-agent.nousresearch.com/docs/getting-started/termux) untuk status kompatibilitas terbaru.

## Pengembangan

Tidak ada dependensi tambahan. Jalankan tes dengan `node --test`.

## Lisensi

MIT. Lihat [LICENSE](LICENSE).
