import { TELEGRAM_BOT_TOKEN } from './config.js';

const API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Chama a Bot API do Telegram.
 * @param {string} method - Ex.: 'sendMessage'
 * @param {object} params - Parâmetros do método
 * @returns {Promise<any>} result
 */
export async function tg(method, params = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }

  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const data = await res.json();
  if (!data.ok) {
    const msg = data.description || 'Telegram API error';
    throw new Error(`Telegram ${method} falhou: ${msg}`);
  }
  return data.result;
}

// Métodos utilitários
export const getMe = () => tg('getMe');

export const setWebhook = ({ url, secretToken, allowedUpdates = ['message'] }) =>
  tg('setWebhook', { url, secret_token: secretToken, drop_pending_updates: false, allowed_updates: allowedUpdates });

export const deleteWebhook = ({ dropPending = true } = {}) =>
  tg('deleteWebhook', { drop_pending_updates: dropPending });

export const sendMessage = (chat_id, text, opts = {}) =>
  tg('sendMessage', {
    chat_id,
    text,
    parse_mode: opts.parse_mode || 'MarkdownV2',
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    reply_to_message_id: opts.reply_to_message_id,
    reply_markup: opts.reply_markup
  });

/**
 * Escape básico para MarkdownV2 (evita erro 400 de parse).
 */
export function escapeMarkdownV2(text = '') {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Trate apenas o que você precisa. É idempotente.
 */
export async function handleUpdate(update) {
  try {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;

      await sendMessage(chatId, `*${escapeMarkdownV2('Ainda em desenvolvimento')}*`);
    }
  } catch (err) {
    console.error('Erro em handleUpdate:', err);
  }
}
