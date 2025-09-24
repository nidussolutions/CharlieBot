import { ai } from '../ai/client.js';

const SYSTEM = `
Você é um extrator de memórias. Dado: (1) mensagem do usuário e (2) resposta do assistente,
extraia fatos duráveis, preferências, dados de contato, objetivos, rotinas e restrições.

Regras:
- Saída deve ser SOMENTE JSON VÁLIDO, sem markdown, sem texto extra.
- Formato:
{
  "memories": [
    { "type": "preference" | "profile" | "goal" | "constraint" | "fact" | "note",
      "content": "texto claro e atômico",
      "importance": 1-5,
      "metadata": { "source": "auto", "confidence": 0.0-1.0 }
    }
  ]
}
- Inclua apenas itens úteis por semanas/meses.
- Seja atômico (uma informação por item).
- importance: 5 = crítica/identidade; 3 = útil; 1 = pouco relevante.
`;

function stripCodeFences(s = '') {
  let t = String(s).trim();

  if (t.startsWith('```')) {
    t = t.replace(/^```[a-zA-Z]*\s*/, '');
    t = t.replace(/```$/, '');
    t = t.trim();
  }

  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }

  return t.trim();
}

export async function extractMemoriesFromExchange({ userText, assistantText }) {
  const contents = [
    { role: 'user', parts: [{ text: `USUÁRIO:\n${userText}\n\nASSISTENTE:\n${assistantText}` }] }
  ];

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    },
    config: { systemInstruction: SYSTEM }
  });

  const raw =
    (typeof res?.text === 'string' && res.text) ||
    res?.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';

  const cleaned = stripCodeFences(raw);

  try {
    const json = JSON.parse(cleaned);
    const arr = Array.isArray(json?.memories) ? json.memories : [];
    return arr
      .filter(m => m?.content && m?.type)
      .map(m => ({
        type: String(m.type),
        content: String(m.content).trim(),
        importance: Number.isFinite(m.importance) ? Math.max(1, Math.min(5, m.importance | 0)) : 2,
        metadata: { ...(m.metadata || {}), extractor: 'gemini' }
      }));
  } catch (e) {
    console.warn('[extractMemories] JSON inválido (após limpeza):', cleaned.slice(0, 300));
    return [];
  }
}
