import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { env } from './config/env.js';

export const createApp = () => {
  const app = express();

  // Trust reverse proxy (Render, Cloudflare, etc.) for HTTPS detection & secure cookies
  app.set('trust proxy', 1);

  // Configure CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          origin === env.CLIENT_URL ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          process.env.NODE_ENV === 'development'
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(env.SESSION_SECRET));

  // Request logger (in dev without logging sensitive credentials)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API modules
  app.use('/api', apiRoutes);

  // Catch 404 for unmatched API routes
  app.use('/api/*', (req, res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};
