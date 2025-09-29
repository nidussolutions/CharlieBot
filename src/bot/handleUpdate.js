import { IsProduction } from '../config.js';
import { sendChatAction, sendMessage } from '../telegram.js';
import { getUserProfile } from '../users/store.js';
import { runAgent } from '../llm/agent.js';

const TYPING_PERIOD_MS = 4500;

async function withTyping(chatId, fn, action = 'typing', periodMs = TYPING_PERIOD_MS) {
  let active = true;
  sendChatAction(chatId, action).catch(() => { });
  const id = setInterval(() => active && sendChatAction(chatId, action).catch(() => { }), periodMs);
  try { return await fn(); } finally { active = false; clearInterval(id); }
}

export async function handleUpdate(update) {
  try {
    if (!update?.message) return;
    const { message: msg } = update;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    if (!text) return;
    if (!IsProduction) console.log('Mensagem recebida:', text);

    const profile = getUserProfile(chatId) || {};
    const result = await withTyping(chatId, () => runAgent({ chatId, text, profile }));

    const out = typeof result?.text === 'string' && result.text
      ? result.text
      : JSON.stringify(result);

    await sendMessage(chatId, out, { reply_to_message_id: msg.message_id });
  } catch (err) {
    console.error('Erro em handleUpdate:', err);
    try { if (update?.message?.chat?.id) await sendMessage(update.message.chat.id, 'Tive um problema ao processar sua mensagem. Tente novamente em instantes.'); } catch { }
  }
}
