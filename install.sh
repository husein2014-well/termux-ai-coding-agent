#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
REPO="https://github.com/husein2014-well/termux-ai-coding-agent.git"
APP_DIR="${HOME}/.local/share/termux-ai-coding-agent"
BIN_DIR="${PREFIX:-$HOME/.local}/bin"
mkdir -p "$(dirname "$APP_DIR")" "$BIN_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 "$REPO" "$APP_DIR"
fi
cat > "$BIN_DIR/termux-ai" <<EOF
#!/data/data/com.termux/files/usr/bin/sh
exec python "$APP_DIR/termux_ai.py" "\$@"
EOF
chmod 755 "$BIN_DIR/termux-ai"
echo "Installed termux-ai. Jalankan: termux-ai setup"
case ":$PATH:" in *":$BIN_DIR:"*) ;; *) echo "Tambahkan ke PATH jika perintah tidak ditemukan: export PATH=\"$BIN_DIR:\$PATH\"";; esac
