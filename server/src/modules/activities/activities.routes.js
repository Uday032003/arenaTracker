import { Router } from 'express';
import { z } from 'zod';
import { ActivitiesController } from './activities.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const createActivitySchema = z.object({
  itemId: z.string().uuid('Valid item ID required'),
  variantId: z.string().uuid().nullable().optional(),
  occurredAt: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  callParticipant: z.string().nullable().optional(),
  callContactLabel: z.string().nullable().optional(),
  callType: z.enum(['incoming', 'outgoing']).nullable().optional(),
  callDurationSeconds: z.number().int().nullable().optional(),
  paymentMode: z.string().nullable().optional(),
  customData: z.record(z.any()).optional(),
  sessionId: z.string().uuid().nullable().optional(),
  sessionDurationSeconds: z.number().int().nullable().optional(),
});

const updateActivitySchema = z.object({
  variantId: z.string().uuid().nullable().optional(),
  occurredAt: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  paymentMode: z.string().nullable().optional(),
  callParticipant: z.string().nullable().optional(),
  callContactLabel: z.string().nullable().optional(),
  callType: z.enum(['incoming', 'outgoing']).nullable().optional(),
  callDurationSeconds: z.number().int().nullable().optional(),
});

router.use(requireAuth);

router.get('/', ActivitiesController.getActivities);
router.post('/', validateBody(createActivitySchema), ActivitiesController.createActivity);
router.get('/:id', ActivitiesController.getActivityById);
router.patch('/:id', validateBody(updateActivitySchema), ActivitiesController.updateActivity);
router.delete('/:id', ActivitiesController.deleteActivity);

export default router;
