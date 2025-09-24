import { TELEGRAM_BOT_TOKEN, IsProduction } from './config.js';

const API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function tg(method, params = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    body.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }

  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Telegram ${method} falhou: resposta não-JSON (${res.status})`);
  }

  if (!data.ok) {
    const msg = data.description || 'Telegram API error';
    if (res.status === 429 || /Too Many Requests/i.test(msg)) {
      const retryAfter = data.pawrameters?.retry_after ?? 1;
      if (!IsProduction) console.warn(`429 ${method}, retry em ${retryAfter}s`);
      await new Promise(r => setTimeout(r, (retryAfter + 0.5) * 1000));
      return tg(method, params);
    }
    throw new Error(`Telegram ${method} falhou: ${msg}`);
  }
  return data.result;
}

export const getMe = () => tg('getMe');

export const setWebhook = ({ url, secretToken, allowedUpdates = ['message'] }) =>
  tg('setWebhook', {
    url,
    secret_token: secretToken,
    drop_pending_updates: false,
    allowed_updates: allowedUpdates
  });

export const deleteWebhook = ({ dropPending = true } = {}) =>
  tg('deleteWebhook', { drop_pending_updates: dropPending });

export const sendMessage = (chat_id, text, opts = {}) => {
  if (text == null) text = '';
  if (typeof text !== 'string') {
    // tente converter com segurança
    if (typeof text === 'number' || typeof text === 'boolean') text = String(text);
    else if (Array.isArray(text)) text = text.join(' ');
    else text = String(text?.text ?? text?.content ?? '');
  }
  tg('sendMessage', {
    chat_id,
    text,
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    message_thread_id: opts.message_thread_id
  });
};

// “typing…”
export const sendChatAction = (chat_id, action = 'typing') =>
  tg('sendChatAction', { chat_id, action });

export const answerCallbackQuery = (callback_query_id, opts = {}) =>
  tg('answerCallbackQuery', {
    callback_query_id,
    text: opts.text,
    show_alert: opts.show_alert ?? false,
    url: opts.url,
    cache_time: opts.cache_time
  });

const INVISIBLES_RX = /[\u200B-\u200D\u2060\uFEFF]/g;

function escapeForCharClass(s) {
  return s.replace(/[\\\]\[\^\-]/g, '\\$&');
}

export function escapeMarkdownV2(text = '', opts = {}) {
  const {
    escapeDots = true,
    stripInvisibles = true,
  } = opts;

  let t = String(text);

  // Normaliza quebras de linha (CRLF -> LF)
  t = t.replace(/\r\n?/g, '\n');

  // Remove invisíveis
  if (stripInvisibles) t = t.replace(INVISIBLES_RX, '');

  // Conjunto oficial de caracteres que precisam de escape no MarkdownV2:
  let specials = '_*[]()~`>#+-=|{}!\\';
  if (escapeDots) specials += '.';

  const re = new RegExp(`(?<!\\\\)([${escapeForCharClass(specials)}])`, 'g');
  t = t.replace(re, '\\$1');

  return t;
}