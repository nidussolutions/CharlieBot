import { getUserProfile } from '../users/store.js';
import { getGoogleAccount } from './store.js';
import { detectIntentAndDraftEvent, finalizeEventDraft } from '../llm/intent.js';
import { createCalendarEvent } from './calendar.js';

export async function tryCreateEventFromText(chatId, userText) {
  const profile = getUserProfile(chatId);
  const gacc = getGoogleAccount(chatId);
  if (!gacc) {
    return { created: false, message: 'Nenhuma conta Google vinculada. Use /linkgoogle para conectar.' };
  }

  const intent = await detectIntentAndDraftEvent({ userText, userProfile: profile || {} });
  if (intent?.action !== 'create_event') {
    return { created: false, message: null };
  }

  const eventInput = finalizeEventDraft(intent.event || {});
  const evt = await createCalendarEvent(String(chatId), eventInput);

  return {
    created: true,
    event: evt,
    confirmText:
      `Evento criado:\n` +
      `${evt.summary}\n` +
      `Início: ${evt.start?.dateTime || evt.start?.date}\n` +
      `Fim: ${evt.end?.dateTime || evt.end?.date}\n` +
      (evt.location ? `Local: ${evt.location}\n` : '') +
      (evt.htmlLink ? `Link: ${evt.htmlLink}` : '')
  };
}
