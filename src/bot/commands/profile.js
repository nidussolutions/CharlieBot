import { sendMessage } from '../../telegram.js';
import { getUserProfile } from '../../users/store.js';
import { getGoogleAccount } from '../../google/store.js';

export default async function showProfile(chatId) {
  const prof = getUserProfile(chatId);
  const gacc = getGoogleAccount(chatId);

  const linhas = [];
  linhas.push('Seu perfil:');
  linhas.push(`Nome: ${prof?.name || '—'}`);
  linhas.push(`E-mail: ${prof?.email || '—'}`);
  linhas.push('');
  linhas.push('Google:');
  if (gacc) {
    linhas.push(`Vinculado: ${gacc.email || '—'}`);
    linhas.push(`Atualizado: ${gacc.updated_at || '—'}`);
    linhas.push('Comandos: /unlinkgoogle para desvincular');
  } else {
    linhas.push('Nenhuma conta vinculada');
    linhas.push('Comandos: /linkgoogle para vincular');
  }

  await sendMessage(chatId, linhas.join('\n'));
}
