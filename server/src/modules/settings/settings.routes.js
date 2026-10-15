import { Router } from 'express';
import { z } from 'zod';
import { SettingsController } from './settings.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const updateSettingsSchema = z.object({
  name: z.string().trim().min(1).optional(),
  timezone: z.string().optional(),
  theme: z.enum(['dark', 'charcoal', 'obsidian', 'light']).optional(),
  preferences: z.record(z.any()).optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password required to confirm account deletion'),
});

router.use(requireAuth);

router.get('/', SettingsController.getSettings);
router.patch('/', validateBody(updateSettingsSchema), SettingsController.updateSettings);
router.get('/export', SettingsController.exportData);
router.delete('/account', validateBody(deleteAccountSchema), SettingsController.deleteAccount);

export default router;
