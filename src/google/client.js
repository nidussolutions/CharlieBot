import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_OAUTH_SCOPES
} from '../config.js';
import { getGoogleAccount, upsertGoogleAccount } from './store.js';

export function newOAuthClient() {
  return new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
  });
}

export function getAuthUrl({ state }) {
  const client = newOAuthClient();
  const scopes = GOOGLE_OAUTH_SCOPES; // já é array normalizado
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: scopes,
    state: String(state),
  });
}

export async function exchangeCode(code, state) {
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: me } = await oauth2.userinfo.get();

  const userId = String(state);
  upsertGoogleAccount({
    userId,
    googleSub: me.id,
    email: me.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,           // pode vir só no primeiro consent
    expiryDate: tokens.expiry_date,
    scope: tokens.scope
  });

  return { userId, email: me.email };
}

export async function getAuthedClient(userId) {
  const row = getGoogleAccount(userId);
  if (!row?.refresh_token && !row?.access_token) return null;

  const client = newOAuthClient();
  client.setCredentials({
    access_token: row.access_token || undefined,
    refresh_token: row.refresh_token || undefined,
    expiry_date: row.token_expiry ? Date.parse(row.token_expiry) : undefined,
    scope: row.scope || undefined,
  });

  client.on('tokens', (tokens) => {
    if (tokens?.access_token || tokens?.refresh_token) {
      upsertGoogleAccount({
        userId,
        googleSub: row.google_sub,
        email: row.email,
        accessToken: tokens.access_token || row.access_token,
        refreshToken: tokens.refresh_token || row.refresh_token,
        expiryDate: tokens.expiry_date || row.token_expiry,
        scope: tokens.scope || row.scope
      });
    }
  });

  return client;
}
