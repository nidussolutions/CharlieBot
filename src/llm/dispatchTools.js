import { upsertUserProfile, getUserProfile } from '../users/store.js';
import { getGoogleAccount, unlinkGoogleAccount } from '../google/store.js';
import { BASE_URL } from '../config.js';
import { createCalendarEvent } from '../google/calendar.js';

export async function dispatchTool({ name, args, chatId }) {
  switch (name) {
    case 'profile_set': {
      const nameArg = (args?.name || '').trim() || undefined;
      const emailArg = (args?.email || '').trim() || undefined;
      upsertUserProfile({ userId: String(chatId), name: nameArg, email: emailArg });
      return { ok: true, message: 'Perfil atualizado', profile: getUserProfile(chatId) };
    }
    case 'profile_show': {
      const prof = getUserProfile(chatId);
      const gacc = getGoogleAccount(chatId);
      return {
        ok: true,
        profile: { name: prof?.name || null, email: prof?.email || null },
        google: gacc ? { linked: true, email: gacc.email, updated_at: gacc.updated_at } : { linked: false }
      };
    }
    case 'google_link_start': {
      const url = `${BASE_URL.replace(/\/+$/, '')}/auth/google?chat_id=${encodeURIComponent(chatId)}`;
      return { ok: true, url };
    }
    case 'google_unlink': {
      unlinkGoogleAccount(chatId);
      return { ok: true, message: 'Conta Google desvinculada' };
    }
    case 'calendar_create_event': {
      const evt = await createCalendarEvent(String(chatId), {
        summary: args?.summary,
        description: args?.description || null,
        startISO: args?.startISO,
        endISO: args?.endISO,
        location: args?.location || null,
        attendees: Array.isArray(args?.attendees) ? args.attendees : []
      });
      return { ok: true, event: { id: evt.id, summary: evt.summary, htmlLink: evt.htmlLink, start: evt.start, end: evt.end, location: evt.location } };
    }
    default:
      return { ok: false, error: `Ferramenta desconhecida: ${name}` };
  }
}
