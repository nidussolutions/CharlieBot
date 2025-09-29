import { ai } from '../ai/client.js';
import { CharliesInstructions } from '../prompts/systemInstructions.js';
import { recallMemories, formatMemoriesBlock } from '../memory/index.js';
import { functionDeclarations } from './tools.js';
import { dispatchTool } from './dispatchTools.js';

export async function runAgent({ chatId, text, profile }) {
  const memories = await recallMemories({ userId: String(chatId), query: text, limit: 8 });
  const systemInstruction = [CharliesInstructions, formatMemoriesBlock(memories)].filter(Boolean).join('\n');

  const history = [
    { role: 'user', parts: [{ text }] }
  ];

  for (let i = 0; i < 6; i++) {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: history,
      tools: { functionDeclarations },
      config: { systemInstruction }
    });

    const parts = res?.candidates?.[0]?.content?.parts || [];
    const fnCall = parts.find(p => p.functionCall);
    if (!fnCall) {
      const out = res?.text ?? parts.map(p => p.text).filter(Boolean).join('\n') ?? '';
      return { text: out };
    }

    const { name, args } = fnCall.functionCall;
    const toolResult = await dispatchTool({ name, args, chatId });
    history.push({ role: 'model', parts: [fnCall] });
    history.push({ role: 'tool', parts: [{ functionResponse: { name, response: toolResult } }] });
  }

  return { text: 'Não consegui concluir a operação.' };
}
