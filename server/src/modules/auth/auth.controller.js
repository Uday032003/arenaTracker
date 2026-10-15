import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const getCookieOptions = () => {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd || env.COOKIE_SECURE,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: (env.SESSION_EXPIRY_DAYS || 30) * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

export class AuthController {
  static async signup(req, res, next) {
    try {
      const { name, email, password, timezone } = req.body;
      const user = await AuthService.createUser({ name, email, password, timezone });
      const { sessionId, expiresAt } = await AuthService.createSession(user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie('session_id', sessionId, getCookieOptions());

      res.status(201).json({
        success: true,
        data: {
          user,
          sessionId,
          expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.authenticateUser({ email, password });
      const { sessionId, expiresAt } = await AuthService.createSession(user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie('session_id', sessionId, getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user,
          sessionId,
          expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const sessionId = req.sessionId || req.cookies?.session_id;
      if (sessionId) {
        await AuthService.destroySession(sessionId);
      }

      const isProd = env.NODE_ENV === 'production';
      res.clearCookie('session_id', {
        httpOnly: true,
        secure: isProd || env.COOKIE_SECURE,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.createPasswordResetToken(email);

      // Return success message without revealing existence
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been generated.',
        data: result ? { resetToken: result.token } : null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }
}
