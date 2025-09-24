import { ai } from '../ai/client.js';

export async function embedText(text) {
  if (!text || !text.trim()) return null;

  const res = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ role: 'user', parts: [{ text }] }]
  });

  const vec = res.embeddings?.[0]?.values;
  return Array.isArray(vec) ? vec : null;
}

export function cosineSim(a, b) {
  if (!a || !b) return 0;
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
