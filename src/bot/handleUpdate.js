import { IsProduction } from '../config.js';
import { generateText } from '../llm/generate.js';
import { sendChatAction, sendMessage } from '../telegram.js';
import { setConfig, showHelp } from './commands/index.js';
import { getUserProfile } from '../users/store.js';

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
    if (!text) return;

    if (!IsProduction) console.log('Mensagem recebida:', text);

    if (/^\/config\b/i.test(text)) {
      await setConfig({ chatId, text });
      return;
    }

    if (/^\/help\b/i.test(text)) {
      showHelp({ chatId });
      return;
    }

    const profile = getUserProfile(chatId);

    if (!profile) {
      const help =
        'Olá! Parece que você ainda não temos seu registro.\n' +
        'Para configurar, envie por exemplo:\n' +
        '/conf nome=Joao da Silva email=joao@exemplo.com\n' +
        'Ou -- \n' +
        '/conf Joao da Silva joao@exemplo.com';
      sendMessage(chatId, help)

      return;
    }

    const aiResponse = await withTyping(chatId, () =>
      generateText({ userId: String(chatId), prompt: text })
    );

    if (!IsProduction) console.log('Resposta da IA:', aiResponse);

    sendMessage(chatId, aiResponse, {
      reply_to_message_id: msg.message_id,
      parse_mode: 'MarkdownV2'
    });

  } catch (err) {
    console.error('Erro em handleUpdate:', err);
    try {
      if (update?.message?.chat?.id) {
        sendMessage(update.message.chat.id, 'Tive um problema ao processar sua mensagem. Tente novamente em instantes.');
      }
    } catch { }
  }
}
