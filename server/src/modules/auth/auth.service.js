import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { env } from '../../config/env.js';

export class AuthService {
  static async createUser({ name, email, password, timezone = 'UTC' }) {
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email address already exists', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, timezone)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, name, email, timezone, created_at`,
      [name.trim(), email.trim(), passwordHash, timezone]
    );

    const user = result.rows[0];

    // Initialize user_settings
    await query(
      `INSERT INTO user_settings (user_id, theme, timezone, preferences)
       VALUES ($1, 'dark', $2, '{}'::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, timezone]
    );

    return user;
  }

  static async authenticateUser({ email, password }) {
    const result = await query(
      'SELECT id, name, email, password_hash, timezone, created_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    delete user.password_hash;
    return user;
  }

  static async createSession(userId, { ip = null, userAgent = null } = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.SESSION_EXPIRY_DAYS);

    await query(
      `INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, userId, expiresAt, ip, userAgent]
    );

    return { sessionId, expiresAt };
  }

  static async destroySession(sessionId) {
    if (!sessionId) return;
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  }

  static async createPasswordResetToken(email) {
    const result = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      // Do not reveal if email exists or not
      return null;
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    return { token, email: email.trim() };
  }

  static async resetPassword(token, newPassword) {
    const result = await query(
      `SELECT pr.id as reset_id, pr.user_id, pr.expires_at, pr.used
       FROM password_resets pr
       WHERE pr.token = $1 AND pr.used = false AND pr.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired password reset link', 400);
    }

    const resetRecord = result.rows[0];
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      passwordHash,
      resetRecord.user_id,
    ]);

    // Invalidate reset token
    await query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.reset_id]);

    // Invalidate all active sessions for security
    await query('DELETE FROM sessions WHERE user_id = $1', [resetRecord.user_id]);

    return true;
  }
}
