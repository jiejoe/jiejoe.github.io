CREATE TABLE IF NOT EXISTS qroom_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  owner_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qroom_messages_created_at
  ON qroom_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_qroom_messages_owner_created
  ON qroom_messages(owner_hash, created_at DESC);
