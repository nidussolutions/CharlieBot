import { getDb } from '../memory/db.js';
const db = getDb();

export function upsertGoogleAccount({ userId, googleSub, email, accessToken, refreshToken, expiryDate, scope }) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const exists = db.prepare('SELECT user_id FROM google_accounts WHERE user_id = ?').get(String(userId));
  if (exists) {
    db.prepare(`
      UPDATE google_accounts SET
        google_sub = COALESCE(?, google_sub),
        email = COALESCE(?, email),
        access_token = ?,
        refresh_token = COALESCE(?, refresh_token),
        token_expiry = ?,
        scope = COALESCE(?, scope),
        updated_at = ?
      WHERE user_id = ?
    `).run(googleSub || null, email || null, accessToken || null, refreshToken || null,
      expiryDate ? new Date(expiryDate).toISOString() : null,
      scope || null, now, String(userId));
  } else {
    db.prepare(`
      INSERT INTO google_accounts
        (user_id, google_sub, email, access_token, refresh_token, token_expiry, scope, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(String(userId), googleSub || null, email || null, accessToken || null, refreshToken || null,
      expiryDate ? new Date(expiryDate).toISOString() : null,
      scope || null, now);
  }
}

export function getGoogleAccount(userId) {
  return db.prepare('SELECT * FROM google_accounts WHERE user_id = ?').get(String(userId));
}

export function unlinkGoogleAccount(userId) {
  db.prepare('DELETE FROM google_accounts WHERE user_id = ?').run(String(userId));
}
