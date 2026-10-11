#!/usr/bin/env bash
set -euo pipefail
REPO="https://github.com/husein2014-well/termux-ai-coding-agent.git"
APP_DIR="${HOME}/.local/share/termux-ai-coding-agent"
BIN_DIR="${PREFIX:-$HOME/.local}/bin"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js belum terpasang. Jalankan: pkg install nodejs-lts" >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "Git belum terpasang. Jalankan: pkg install git" >&2
  exit 1
fi
mkdir -p "$(dirname "$APP_DIR")" "$BIN_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 "$REPO" "$APP_DIR"
fi
cat > "$BIN_DIR/termux-ai" <<EOF
#!/usr/bin/env sh
exec node "$APP_DIR/termux-ai.js" "\$@"
EOF
chmod 755 "$BIN_DIR/termux-ai"
echo "Installed termux-ai (Node.js). Jalankan: termux-ai setup; setelah bot Telegram aktif, minta /key lalu jalankan: termux-ai login"
case ":$PATH:" in *":$BIN_DIR:"*) ;; *) echo "Tambahkan ke PATH jika perintah tidak ditemukan: export PATH=\"$BIN_DIR:\$PATH\"";; esac
