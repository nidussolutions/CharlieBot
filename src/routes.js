import express from 'express';
import {
  BASE_URL,
  TELEGRAM_SECRET_TOKEN,
  IsProduction
} from './config.js';

import {
  setWebhook,
  deleteWebhook,
} from './telegram.js';

import { handleUpdate } from './bot/handleUpdate.js';


const route = express.Router();

// Healthcheck
route.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Endpoint para SET do webhook (usa BASE_URL do .env)
route.get('/setup/webhook', async (_req, res) => {
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
route.get('/teardown/webhook', async (_req, res) => {
  try {
    const result = await deleteWebhook({ dropPending: true });
    res.json({ ok: true, result, note: 'Webhook removido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Webhook do Telegram
route.post('/telegram/webhook', async (req, res) => {
  const headerToken = req.get('x-telegram-bot-api-secret-token');
  if (!headerToken || headerToken !== TELEGRAM_SECRET_TOKEN) {
    return res.sendStatus(401);
  }

  res.status(200).end();

  // Log de acesso ao webhook
  if (!IsProduction) console.log('Webhook recebido:', req.body);

  // log de produção - ip e data
  if (IsProduction) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = new Date().toISOString();
    console.log(`[${now}] Webhook recebido de ${ip}`);
  }

  const update = req.body;
  await handleUpdate(update)
});

export default route;