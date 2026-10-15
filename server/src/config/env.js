import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET || 'arena-default-session-secret-change-in-prod',
  SESSION_EXPIRY_DAYS: parseInt(process.env.SESSION_EXPIRY_DAYS || '30', 10),
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || 'BEmgCtGm_gNKGumyOPAKWSCn6GHExD1vshdqOPPPOQdqUiifvcY09c6jgM-zMaLfPqdanbESfFaFLTEVHp23hME',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '_ZRGo2Wk3eEXDkn7k8wgo9o3IRMpZ7gSDwKzO8PGDII',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:admin@arenatracker.local',
};
