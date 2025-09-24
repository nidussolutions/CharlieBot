// src/llm/generate.js
import { ai } from '../ai/client.js';
import { CharliesInstructions } from '../prompts/systemInstructions.js';
import { recallMemories, formatMemoriesBlock, saveMemory } from '../memory/index.js';
import { extractMemoriesFromExchange } from '../memory/extractor.js';

export async function generateText({ userId, prompt }) {
  await saveMemory({
    userId,
    type: 'msg',
    content: prompt,
    importance: 1,
    metadata: { channel: 'telegram' }
  });

  const memories = await recallMemories({ userId, query: prompt, limit: 8 });
  const memBlock = formatMemoriesBlock(memories);
  const systemInstruction = [CharliesInstructions, memBlock].filter(Boolean).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: { systemInstruction }
  });

  const text = response.text || '';

  try {
    const extracted = await extractMemoriesFromExchange({ userText: prompt, assistantText: text });
    for (const m of extracted) {
      await saveMemory({
        userId,
        type: m.type,
        content: m.content,
        importance: m.importance ?? 2,
        metadata: m.metadata || {}
      });
    }
  } catch (e) {
    console.error('extract/save mem falhou:', e);
  }

  try {
    const summary = `Interação: ${prompt.slice(0, 80)} -> ${text.slice(0, 120)}`;
    await saveMemory({ userId, type: 'note', content: summary, importance: 2, metadata: { kind: 'summary' } });
  } catch { }

  return text;
}
