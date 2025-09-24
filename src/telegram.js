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
      const retryAfter = data.parameters?.retry_after ?? 1;
      if (!IsProduction) console.warn(`429 ${method}, retry em ${retryAfter}s`);
      await new Promise(r => setTimeout(r, (retryAfter + 0.5) * 1000));
      return tg(method, params);
    }
    throw new Error(`Telegram ${method} falhou: ${msg}`);
  }
  return data.result;
}

// --- helpers base ---
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

export const sendMessage = (chat_id, text, opts = {}) =>
  tg('sendMessage', {
    chat_id,
    text,
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    message_thread_id: opts.message_thread_id
  });

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

export function escapeMarkdownV2(text = '') {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
