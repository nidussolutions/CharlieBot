import { IsProduction } from '../config.js';
import { generateText } from '../llm/generate.js';
import { sendChatAction, sendMessage } from '../telegram.js';
import { getUserProfile } from '../users/store.js';
import { BASE_URL } from '../config.js';
import { tryCreateEventFromText } from '../google/createFromNL.js';

import {
  setConfig,
  showHelp,
  showProfile,
  linkGoogle,
  unlinkGoogleCmd
} from './commands/index.js';

const TYPING_PERIOD_MS = 4500;

async function withTyping(chatId, fn, action = 'typing', periodMs = TYPING_PERIOD_MS) {
  let active = true;
  sendChatAction(chatId, action).catch(() => { });
  const id = setInterval(() => active && sendChatAction(chatId, action).catch(() => { }), periodMs);

  try {
    return await fn();
  } finally {
    active = false;
    clearInterval(id);
  }
}

function isCommand(text, cmd) {
  return new RegExp(`^/${cmd}\\b`, 'i').test(text);
}

export async function handleUpdate(update) {
  try {
    if (!update?.message) return;

    const { message: msg } = update;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    if (!text) return;
    if (!IsProduction) console.log('Mensagem recebida:', text);

    if (isCommand(text, 'config') || isCommand(text, 'conf')) {
      await setConfig({ chatId, text });
      return;
    }

    if (isCommand(text, 'help')) {
      showHelp({ chatId });
      return;
    }

    const profile = getUserProfile(chatId);
    if (!profile) {
      const help =
        'Olá! Parece que você ainda não tem registro.\n' +
        'Para configurar, envie por exemplo:\n' +
        '/config nome=Joao da Silva email=joao@exemplo.com\n' +
        'ou\n' +
        '/config Joao da Silva joao@exemplo.com';
      sendMessage(chatId, help);
      return;
    }

    if (/^\/linkgoogle\b/i.test(text)) {
      await linkGoogle({ chatId, baseUrl: BASE_URL });
      return;
    }

    if (/^\/unlinkgoogle\b/i.test(text)) {
      await unlinkGoogleCmd({ chatId });
      return;
    }

    if (isCommand(text, 'profile')) {
      await showProfile(chatId);
      return;
    }

    const { created, confirmText, message } = await tryCreateEventFromText(chatId, text);

    if (message) {
      sendMessage(chatId, message);
      return;
    }

    if (created) {
      sendMessage(chatId, confirmText);
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
