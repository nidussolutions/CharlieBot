import 'dotenv/config';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const BASE_URL = process.env.BASE_URL;
export const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || 'changeme';
export const PORT = process.env.PORT || 3000;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Faltou TELEGRAM_BOT_TOKEN no .env');
  process.exit(1);
}
