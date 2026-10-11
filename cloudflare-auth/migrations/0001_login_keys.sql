CREATE TABLE IF NOT EXISTS telegram_users (
  telegram_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_keys (
  telegram_id TEXT PRIMARY KEY REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_keys_expiry ON access_keys(expires_at);
