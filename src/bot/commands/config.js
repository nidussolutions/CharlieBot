import { escapeMarkdownV2, sendMessage } from '../../telegram.js';
import { upsertUserProfile } from '../../users/store.js';
import { saveMemory } from '../../memory/index.js';

const EMAIL_RX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function parseConfigText(text) {
  const raw = text.replace(/^\/conf\s*/i, '').trim();

  if (!raw) return {};

  const pairs = {};
  const pairRx = /(\b(?:nome|name|email)\b)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"']+))/gi;
  let m;
  while ((m = pairRx.exec(raw)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    pairs[key] = val.trim();
  }

  let name = pairs.nome || pairs.name;
  let email = pairs.email;

  if (!name || !email) {
    const tokens = raw.split(/\s+/).filter(Boolean);
    const emailTok = tokens.find(t => EMAIL_RX.test(t));
    if (emailTok && !email) email = emailTok;
    if (!name) {
      const nameTokens = tokens.filter(t => t !== emailTok);
      if (nameTokens.length) name = nameTokens.join(' ');
    }
  }

  if (email && !EMAIL_RX.test(email)) email = undefined;
  if (name) name = name.replace(/\s+/g, ' ').trim();

  return { name, email };
}

export function sendPlain(chatId, text, opts = {}) {
  return sendMessage(chatId, text, { ...opts });
}

export default async function handleConfigCommand({ chatId, text }) {
  const { name, email } = parseConfigText(text);

  if (!name && !email) {
    if (profile?.name && profile?.email) {
      const msg =
        `Suas configurações atuais:\n` +
        `Nome: ${profile.name || '—'}\n` +
        `E-mail: ${profile.email || '—'}\n` +
        `Atualizado em: ${profile.updated_at}`;
      sendPlain(chatId, msg);
    } else {
      const help =
        'Nenhuma configuração encontrada.\n' +
        'Para configurar, envie por exemplo:\n' +
        '/conf nome=Joao da Silva email=joao@exemplo.com\n' +
        'Ou: /conf Joao da Silva joao@exemplo.com';
      sendPlain(chatId, help);
    }
    return;
  }

  upsertUserProfile({ userId: String(chatId), name, email });

  if (name) {
    await saveMemory({
      userId: String(chatId),
      type: 'profile',
      content: `O nome do usuário é ${name}.`,
      importance: 5,
      metadata: { source: 'config' }
    });
  }

  if (email) {
    await saveMemory({
      userId: String(chatId),
      type: 'contact',
      content: `O e-mail do usuário é ${email}.`,
      importance: 4,
      metadata: { source: 'config' }
    });
  }

  const ok = [];
  if (name) ok.push(`nome: ${name}`);
  if (email) ok.push(`email: ${email}`);
  const conf = escapeMarkdownV2(`Configuração salva: ${ok.join(' | ')}`);
  sendMessage(chatId, conf);
}
