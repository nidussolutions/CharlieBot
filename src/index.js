import express from 'express';
import {
  PORT,
  BASE_URL,
  TELEGRAM_SECRET_TOKEN
} from './config.js';
import {
  getMe,
  setWebhook,
  deleteWebhook,
  handleUpdate,
  sendMessage
} from './telegram.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Endpoint para SET do webhook (usa BASE_URL do .env)
app.get('/setup/webhook', async (_req, res) => {
  try {
    if (!BASE_URL) return res.status(400).json({ ok: false, error: 'Defina BASE_URL no .env' });
    const url = `${BASE_URL.replace(/\/+$/, '')}/telegram/webhook`;
    const result = await setWebhook({ url, secretToken: TELEGRAM_SECRET_TOKEN });
    res.json({ ok: true, result, url, note: 'Webhook configurado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Remover webhook
app.get('/teardown/webhook', async (_req, res) => {
  try {
    const result = await deleteWebhook({ dropPending: true });
    res.json({ ok: true, result, note: 'Webhook removido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Info do bot
app.get('/me', async (_req, res) => {
  try {
    const me = await getMe();
    res.json({ ok: true, me });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Sua API para disparar mensagens (ex.: do seu site/painel)
app.post('/api/send', async (req, res) => {
  try {
    const { chat_id, text, parse_mode } = req.body || {};
    if (!chat_id || !text) return res.status(400).json({ ok: false, error: 'chat_id e text são obrigatórios' });
    const result = await sendMessage(chat_id, text, { parse_mode });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Webhook do Telegram
app.post('/telegram/webhook', async (req, res) => {
  const headerToken = req.get('x-telegram-bot-api-secret-token');
  if (!headerToken || headerToken !== TELEGRAM_SECRET_TOKEN) {
    return res.sendStatus(401);
  }
  res.status(200).end();

  const update = req.body;
  await handleUpdate(update);
});

app.listen(PORT, () => {
  console.log(`Server rodando em http://localhost:${PORT}`);
});
