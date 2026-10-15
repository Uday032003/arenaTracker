import { Router } from 'express';
import { z } from 'zod';
import { SessionsController } from './sessions.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const startSessionSchema = z.object({
  itemId: z.string().uuid('Valid item ID required'),
  notes: z.string().optional().default(''),
  startedAt: z.string().optional(),
});

const stopSessionSchema = z.object({
  endedAt: z.string().optional(),
  notes: z.string().optional(),
  createActivityLog: z.boolean().optional().default(true),
});

router.use(requireAuth);

router.get('/active', SessionsController.getActiveSessions);
router.post('/start', validateBody(startSessionSchema), SessionsController.startSession);
router.post('/:id/stop', validateBody(stopSessionSchema), SessionsController.stopSession);
router.get('/', SessionsController.getSessions);
router.get('/:id', SessionsController.getSessionById);

export default router;
