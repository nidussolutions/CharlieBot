import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.env.DB_DIR || process.cwd(), 'memory.sqlite');

export function getDb() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '');
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'note',
      content TEXT NOT NULL,
      metadata TEXT,
      embedding TEXT,
      importance INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
      last_used_at DATETIME,
      hash TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_memories_last_used ON memories(last_used_at);
    CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);

    -- Índice único para deduplicar por usuário+hash
    CREATE UNIQUE INDEX IF NOT EXISTS ux_memories_user_hash ON memories(user_id, hash);
  `);

  console.log('[memory] usando', DB_PATH);
  return db;
}
