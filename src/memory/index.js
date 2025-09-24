import { getDb } from './db.js';
import { embedText, cosineSim } from './embeddings.js';
import crypto from 'node:crypto';

const db = getDb();

function normalizeContent(s = '') {
  return String(s).trim().replace(/\s+/g, ' ').toLowerCase();
}

function hashFor(userId, type, content) {
  const base = `${userId}::${type}::${normalizeContent(content)}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

export async function saveMemory({ userId, type = 'note', content, metadata = {}, importance = 1 }) {
  if (!userId) throw new Error('saveMemory: userId obrigatório');
  if (!content) throw new Error('saveMemory: content obrigatório');

  const hash = hashFor(userId, type, content);
  const embedding = await embedText(content);

  const stmt = db.prepare(`
    INSERT INTO memories (user_id, type, content, metadata, embedding, importance, hash)
    VALUES (@user_id, @type, @content, @metadata, @embedding, @importance, @hash)
    ON CONFLICT(user_id, hash) DO UPDATE SET
      importance = MAX(importance, excluded.importance),
      metadata = COALESCE(excluded.metadata, metadata),
      updated_at = datetime('now')
  `);

  const info = stmt.run({
    user_id: String(userId),
    type,
    content,
    metadata: JSON.stringify(metadata || {}),
    embedding: embedding ? JSON.stringify(embedding) : null,
    importance: Math.max(1, Math.min(5, importance | 0)),
    hash
  });

  return info.lastInsertRowid;
}

function touchMemories(ids = []) {
  if (!ids.length) return;
  const qMarks = ids.map(() => '?').join(',');
  db.prepare(`UPDATE memories SET last_used_at = datetime('now') WHERE id IN (${qMarks})`).run(ids);
}

export async function recallMemories({ userId, query, limit = 8 }) {
  if (!userId) throw new Error('recallMemories: userId obrigatório');

  const base = db.prepare(`
    SELECT id, type, content, metadata, embedding, importance, created_at, updated_at, last_used_at
    FROM memories
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 1000
  `).all(String(userId));

  if (!base.length) return [];

  let queryVec = null;
  if (query && query.trim()) queryVec = await embedText(query);

  const now = Date.now();
  const scored = base.map(row => {
    const emb = row.embedding ? JSON.parse(row.embedding) : null;
    const sim = queryVec && emb ? cosineSim(queryVec, emb) : 0;

    const imp = Math.max(1, Math.min(5, row.importance || 1));
    const importanceNorm = (imp - 1) / 4; // 0..1

    const t = row.last_used_at ? Date.parse(row.last_used_at) : Date.parse(row.updated_at);
    const days = Math.max(0, (now - (t || now)) / (1000 * 60 * 60 * 24));
    const recencyBoost = 1 / (1 + days);

    const score = 0.7 * sim + 0.2 * importanceNorm + 0.1 * recencyBoost;
    return { ...row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.max(1, limit));
  touchMemories(top.map(x => x.id));

  return top.map(x => ({
    id: x.id,
    type: x.type,
    content: x.content,
    metadata: safeParseJSON(x.metadata),
    importance: x.importance
  }));
}

function safeParseJSON(s) {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}

export function formatMemoriesBlock(memories = []) {
  if (!memories.length) return '';
  const lines = memories.map(m => `- [${m.type || 'note'}] ${m.content}`);
  return ['---', 'MEMÓRIAS RELEVANTES (uso interno — não expor diretamente):', ...lines].join('\n');
}
