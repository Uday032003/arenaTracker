import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to cwd .env

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/activity_tracker';

const isRemoteOrSsl = connectionString.includes('supabase.co') || 
                      connectionString.includes('sslmode=require') || 
                      process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString,
  ssl: isRemoteOrSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 500) {
    console.warn(`[DB Slow Query] ${duration}ms: ${text.slice(0, 80)}...`);
  }
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};
