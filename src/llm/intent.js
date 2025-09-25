import { ai } from '../ai/client.js';
import { DateTime } from 'luxon';
import * as chrono from 'chrono-node';

const TZ = 'America/Sao_Paulo';

export async function detectIntentAndDraftEvent({ userText, userProfile }) {
  const system = `
    Você é um roteador de intenções de agenda.
    Decida se o usuário quer CRIAR um evento.
    Se sim, retorne JSON com o schema abaixo. Caso contrário, retorne action "none".

    Schema:
    {
      "action": "create_event" | "none",
      "event": {
        "summary": string,                // título curto
        "description": string | null,     // opcional
        "dateText": string | null,        // pedaço de texto com data/horário mencionado, para ajudar parser
        "startISO": string | null,        // preferir ISO local com timezone "-03:00"
        "endISO": string | null,          // idem
        "durationMin": number | null,     // se só tiver horário de início
        "location": string | null,
        "attendees": string[] | null      // e-mails
      }
    }

    Regras:
    - Se o usuário descreve uma reunião, call, consulta, etc., a intenção é "create_event".
    - Use informações do perfil quando fizer sentido (ex.: e-mail do usuário não é attendee).
    - Nomes de pessoas sem e-mail NÃO entram em attendees.
    - Saída deve ser SOMENTE JSON válido (sem markdown).
  `;

  const contents = [
    {
      role: 'user', parts: [{
        text: `
Perfil: nome=${userProfile?.name || ''} email=${userProfile?.email || ''}
Mensagem: ${userText}
Agora retorne apenas JSON conforme o schema.
` }]
    }
  ];

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    config: { systemInstruction: system }
  });

  const raw = (typeof res?.text === 'string' && res.text) ||
    res?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    return JSON.parse(raw);
  } catch {
    return { action: 'none' };
  }
}

export function finalizeEventDraft(draft) {
  const now = DateTime.now().setZone(TZ);
  const nextHour = now.plus({ hours: 1 }).startOf('hour');

  let start = null;
  let end = null;

  if (draft.startISO) start = DateTime.fromISO(draft.startISO, { zone: TZ });
  if (draft.endISO) end = DateTime.fromISO(draft.endISO, { zone: TZ });

  if ((!start || !end) && draft.dateText) {
    const parsed = chrono.parse(draft.dateText, now.toJSDate(), { forwardDate: true });
    if (parsed?.[0]) {
      const p = parsed[0];
      const from = DateTime.fromJSDate(p.start?.date() || now.toJSDate()).setZone(TZ);
      const to = p.end ? DateTime.fromJSDate(p.end.date()).setZone(TZ) : null;
      if (!start) start = from;
      if (!end && to) end = to;
    }
  }

  if (!start) start = nextHour;
  if (!end) {
    const dur = Number.isFinite(draft.durationMin) ? draft.durationMin : 60;
    end = start.plus({ minutes: dur });
  }

  if (end <= start) end = start.plus({ minutes: 60 });

  return {
    summary: (draft.summary || 'Compromisso').slice(0, 120),
    description: draft.description || null,
    startISO: start.toISO(),
    endISO: end.toISO(),
    location: draft.location || null,
    attendees: Array.isArray(draft.attendees) ? draft.attendees.filter(Boolean) : []
  };
}
