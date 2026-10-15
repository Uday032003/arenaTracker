import { query } from '../config/db.js';
import { AppError } from './errorHandler.js';

export const requireAuth = async (req, res, next) => {
  try {
    let sessionId = req.cookies?.session_id;

    if (!sessionId && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Session')) {
        sessionId = parts[1];
      }
    }

    if (!sessionId) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // Lookup session and join user
    const result = await query(
      `SELECT s.id as session_id, s.expires_at, u.id, u.name, u.email, u.timezone, u.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      // Clear invalid cookie
      res.clearCookie('session_id', {
        httpOnly: true,
        sameSite: 'lax',
      });
      return next(new AppError('Session expired or invalid. Please log in again.', 401));
    }

    const row = result.rows[0];
    req.user = {
      id: row.id,
      name: row.name,
      email: row.email,
      timezone: row.timezone || 'UTC',
      created_at: row.created_at,
    };
    req.sessionId = row.session_id;

    next();
  } catch (err) {
    next(err);
  }
};
