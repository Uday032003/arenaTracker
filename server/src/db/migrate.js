import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[Migrations] Connecting to PostgreSQL database...');
    
    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query(`SELECT version FROM schema_migrations`);
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    for (const file of files) {
      if (!appliedVersions.has(file)) {
        console.log(`[Migrations] Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[Migrations] Migration ${file} successfully applied.`);
      } else {
        console.log(`[Migrations] Migration ${file} already applied, skipping.`);
      }
    }

    console.log('[Migrations] All migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migrations Error]', err);
    throw err;
  } finally {
    client.release();
  }
}

// If executed directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migrations] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrations] Failed:', err);
      process.exit(1);
    });
}
