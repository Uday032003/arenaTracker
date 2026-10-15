import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  timezone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/signup', authLimiter, validateBody(signupSchema), AuthController.signup);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);

export default router;
