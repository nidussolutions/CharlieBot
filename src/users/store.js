import { getDb } from '../memory/db.js';

const db = getDb();

export function upsertUserProfile({ userId, name, email }) {
  if (!userId) throw new Error('upsertUserProfile: userId obrigatório');
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const exists = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get(String(userId));
  if (exists) {
    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        updated_at = ?
      WHERE user_id = ?
    `).run(name || null, email || null, now, String(userId));
  } else {
    db.prepare(`
      INSERT INTO users (user_id, name, email, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(String(userId), name || null, email || null, now);
  }
}

export function getUserProfile(userId) {
  return db.prepare('SELECT user_id, name, email, updated_at FROM users WHERE user_id = ?')
    .get(String(userId));
}
