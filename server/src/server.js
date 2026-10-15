import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { pool } from './config/db.js';
import { startPushScheduler, stopPushScheduler } from './modules/push/push.scheduler.js';

const app = createApp();

async function start() {
  try {
    // Test database connection
    console.log('[Server] Connecting to database...');
    await pool.query('SELECT 1');
    console.log('[Server] Database connected successfully.');

    // Run migrations
    await runMigrations();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Activity Tracker backend running at http://localhost:${env.PORT}`);
      console.log(`[Server] Environment: ${env.NODE_ENV}`);
      // Start background push notification scheduler for reminder alarms
      startPushScheduler(30000);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      stopPushScheduler();
      server.close(() => {
        console.log('[Server] Closed HTTP server.');
        pool.end(() => {
          console.log('[Server] Database pool closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
