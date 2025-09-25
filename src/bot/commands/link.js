import { sendMessage } from '../../telegram.js';
import { getGoogleAccount, unlinkGoogleAccount } from '../../google/store.js';

export async function linkGoogle({ chatId, baseUrl }) {
  const url = `${baseUrl.replace(/\/+$/, '')}/auth/google?chat_id=${encodeURIComponent(chatId)}`;
  sendMessage(chatId, `Para vincular sua conta Google, acesse: ${url}`);
}

export async function unlinkGoogleCmd({ chatId }) {
  const row = getGoogleAccount(chatId);
  if (!row) {
    sendMessage(chatId, 'Nenhuma conta Google vinculada.');
    return;
  }
  unlinkGoogleAccount(chatId);
  sendMessage(chatId, 'Conta Google desvinculada.');
}
