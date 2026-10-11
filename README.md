# Termux AI Coding Assistant

CLI asisten coding untuk Android Termux yang ditulis dalam **JavaScript dan Node.js**. Menggabungkan tanya-jawab coding, konteks project, dan usulan edit. Mendukung provider chat-completions OpenAI-compatible dan bisa meneruskan argumen ke Hermes Agent yang telah terpasang.

> Proyek komunitas independen, bukan produk resmi Blackbox AI, Cursor, atau Nous Research. Anda perlu API key/model sendiri; biaya provider, bila ada, ditagihkan oleh provider.

## Instalasi dari GitHub

Di aplikasi Termux:

```sh
pkg update
pkg install -y git nodejs-lts
curl -fsSL https://raw.githubusercontent.com/husein2014-well/termux-ai-coding-agent/main/install.sh | bash
termux-ai setup
```

Installer memasang source JavaScript ke `~/.local/share/termux-ai-coding-agent` dan membuat perintah `termux-ai`. Tidak membutuhkan Python atau paket npm tambahan. API key disimpan lokal di `~/.config/termux-ai/config.json` dengan permission terbatas. Contoh OpenRouter: base URL `https://openrouter.ai/api/v1` dan model yang tersedia pada akun Anda.

## Menyalakan akses lokal latar belakang

Pilih folder project yang akan boleh dibaca/diubah, lalu mulai daemon:

```sh
termux-ai service start --root ~/projects/nama-project
termux-ai service status
```

Daemon berjalan di latar belakang **selama Termux aktif**, mendengarkan hanya pada `127.0.0.1` (perangkat itu sendiri), dan membatasi operasi file ke folder yang dipilih. Path traversal dan symlink ke luar folder ditolak. API lokal memakai token acak yang disimpan di `~/.config/termux-ai/service.json` dengan izin file terbatas. Daemon tidak meminta akses root, kamera, mikrofon, lokasi, kontak, atau SMS. Ia tidak dikonfigurasi untuk mulai saat ponsel boot. Android masih dapat menangguhkan atau menghentikan proses Termux.

Contoh saat daemon aktif:

```sh
termux-ai ask "Jelaskan struktur aplikasi ini" --file src/app.js
termux-ai review src
termux-ai edit src/app.js "Tambahkan validasi input"
termux-ai service pending
termux-ai approve <id-usulan>
termux-ai service stop
```

Perintah `edit` membuat usulan dan menampilkan diff; perubahan belum diterapkan sampai Anda menjalankan `approve` dan mengonfirmasi `y`. Usulan yang menunggu persetujuan hanya disimpan di memori daemon dan hilang jika daemon berhenti.

AI juga dapat **mengusulkan** perintah terminal:

```sh
termux-ai command "Jalankan tes project"
termux-ai approve <id-usulan>
```

Perintah terminal tidak dijalankan otomatis. `approve` menampilkan teks perintah persisnya dan meminta persetujuan terlebih dahulu. **Penting:** setelah disetujui, perintah shell berjalan dengan izin akun Termux dan secara teknis dapat membaca atau mengubah berkas di luar folder project. Jika Anda ingin batas folder project yang ketat, jangan setujui usulan perintah shell; operasi baca/edit file melalui daemon tetap dibatasi ke workspace.

Untuk memulai ulang layanan setelah Termux ditutup, jalankan lagi perintah `service start`. Installer tidak memasang Termux:Boot dan tidak mengubah pengaturan baterai Android.

## Perintah tanpa daemon

```sh
termux-ai chat
termux-ai ask "Jelaskan kode ini" --file app.js
termux-ai review ./src
termux-ai edit app.js "Tambahkan validasi input"
termux-ai config
```

Saat daemon aktif, operasi tanya/review/edit diarahkan melalui batas workspace daemon. Tanpa daemon, perintah CLI berjalan langsung dan file yang Anda sebutkan dikirim ke provider AI; hindari memilih file sensitif.

## Hermes Agent

Jika perintah `hermes` tersedia, gunakan `termux-ai hermes --help` atau `termux-ai hermes`. Hermes adalah proyek upstream terpisah dan tidak dipasang oleh installer ini. Periksa [panduan resmi Hermes untuk Termux](https://hermes-agent.nousresearch.com/docs/getting-started/termux) untuk status kompatibilitas terbaru.

## Keamanan & pengembangan

- Prompt dan konteks file yang dipilih dikirim ke endpoint provider AI Anda.
- `.env`, kunci privat, nama file berisi `secret`/`credential`, serta folder `.git`, `node_modules`, virtualenv, dan cache dikecualikan dari konteks.
- Daemon menerima koneksi hanya dari localhost dan memerlukan bearer token. Jangan membagikan file `service.json`.
- Tinjau diff dan teks lengkap perintah sebelum menyetujui. Tidak ada perintah shell yang berjalan tanpa persetujuan melalui CLI.
- Tanpa dependensi tambahan. Jalankan tes dengan `node --test`.

## Lisensi

MIT. Lihat [LICENSE](LICENSE).
