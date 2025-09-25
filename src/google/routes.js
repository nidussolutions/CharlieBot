import express from 'express';
import { getAuthUrl, exchangeCode } from './client.js';
import { sendMessage } from '../telegram.js';

export const router = express.Router();

router.get('/auth/google', (req, res) => {
  const chatId = req.query.chat_id;
  if (!chatId) return res.status(400).send('chat_id obrigatório');
  const url = getAuthUrl({ state: String(chatId) });
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('Parâmetros inválidos');

    const { userId, email } = await exchangeCode(code, state);

    // avisa o usuário no Telegram
    await sendMessage(userId, `Conta Google vinculada com sucesso: ${email}`);
    res.send('Tudo certo! Pode voltar ao Telegram.');
  } catch (e) {
    console.error('OAuth callback error:', e);
    res.status(500).send('Falha ao vincular Google. Tente novamente.');
  }
});
