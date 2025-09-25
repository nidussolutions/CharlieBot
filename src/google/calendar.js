import { google } from 'googleapis';
import { getAuthedClient } from './client.js';

export async function createCalendarEvent(userId, { summary, description, startISO, endISO, location, attendees = [] }) {
  const auth = await getAuthedClient(userId);
  if (!auth) throw new Error('Conta Google não vinculada');

  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary,
      description,
      start: { dateTime: startISO },
      end: { dateTime: endISO },
      location,
      attendees: attendees.map(e => ({ email: e })),
      reminders: { useDefault: true }
    }
  });
  return res.data;
}
