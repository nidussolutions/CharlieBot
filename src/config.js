import 'dotenv/config';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const BASE_URL = process.env.BASE_URL;
export const GENAI_API_KEY = process.env.GENAI_API_KEY;
export const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || 'changeme';
export const PORT = process.env.CHARLIES_PORT || 3000;
export const IsProduction = process.env.NODE_ENV === 'production';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Faltou TELEGRAM_BOT_TOKEN no .env');
  process.exit(1);
}

if (!GENAI_API_KEY) {
  console.error('Faltou GENAI_API_KEY no .env');
  process.exit(1);
}

if (!BASE_URL) {
  console.error('Faltou BASE_URL no .env');
  process.exit(1);
}

function normalizeScopes(val) {
  if (!val) return ['https://www.googleapis.com/auth/calendar']; // default
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    // permite separado por vírgula, espaço ou quebra de linha
    return val.split(/[,\s]+/g).filter(Boolean);
  }
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch { }
  // fallback: força string única
  return [String(val)];
}

export const GOOGLE_OAUTH_SCOPES = normalizeScopes(process.env.GOOGLE_OAUTH_SCOPES);