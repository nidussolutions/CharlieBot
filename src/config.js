import 'dotenv/config';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const BASE_URL = process.env.BASE_URL;
export const GENAI_API_KEY = process.env.GENAI_API_KEY;
export const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || 'changeme';
export const PORT = process.env.PORT || 3000;
export const IsProduction = process.env.NODE_ENV === 'production';

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
