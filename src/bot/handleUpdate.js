import { IsProduction } from '../config.js';
import { generateText } from '../llm/generate.js';
import { sendChatAction, sendMessage } from '../telegram.js';

async function withTyping(chatId, fn, action = 'typing', periodMs = 4500) {
  let active = true;
  sendChatAction(chatId, action).catch(() => { });
  const id = setInterval(() => {
    if (!active) return;
    sendChatAction(chatId, action).catch(() => { });
  }, periodMs);

  try {
    return await fn();
  } finally {
    active = false;
    clearInterval(id);
  }
}

export async function handleUpdate(update) {
  try {
    if (!update?.message) return;

    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();

    if (!text || text.startsWith('/')) return;

    if (!IsProduction) console.log('Mensagem recebida:', text);

    sendChatAction(chatId, 'typing');
    const aiResponse = await withTyping(chatId, () =>
      generateText({ userId: String(chatId), prompt: text })
    );
    if (!IsProduction) console.log('Resposta da IA:', aiResponse);

    await sendMessage(chatId, aiResponse, {
      reply_to_message_id: msg.message_id,
      parse_mode: 'MarkdownV2'
    });

  } catch (err) {
    console.error('Erro em handleUpdate:', err);
    try {
      if (update?.message?.chat?.id) {
        await sendMessage(update.message.chat.id, 'Tive um problema ao processar sua mensagem. Tente novamente em instantes.');
      }
    } catch { }
  }
}
