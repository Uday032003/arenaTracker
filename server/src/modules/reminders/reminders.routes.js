import { Router } from 'express';
import { z } from 'zod';
import { RemindersController } from './reminders.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const reminderCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  type: z.enum(['emi', 'birthday', 'bill', 'anniversary', 'medicine', 'meeting', 'custom']).optional().default('custom'),
  amount: z.union([z.number(), z.string(), z.null()]).optional(),
  currency: z.string().optional().default('₹'),
  due_datetime: z.string().min(1, 'Due date and time is required'),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional().default('none'),
  alarm_enabled: z.boolean().optional().default(true),
  remind_before_days: z.union([z.number(), z.string()]).optional().default(0),
  notes: z.string().optional().nullable(),
});

const reminderUpdateSchema = reminderCreateSchema.partial().extend({
  status: z.enum(['pending', 'dismissed', 'completed', 'snoozed']).optional(),
});

router.use(requireAuth);

router.get('/', RemindersController.getReminders);
router.get('/due', RemindersController.getDueReminders);
router.post('/', validateBody(reminderCreateSchema), RemindersController.createReminder);
router.patch('/:id', validateBody(reminderUpdateSchema), RemindersController.updateReminder);
router.post('/:id/dismiss', RemindersController.dismissReminder);
router.post('/:id/snooze', RemindersController.snoozeReminder);
router.post('/:id/complete', RemindersController.completeReminder);
router.delete('/:id', RemindersController.deleteReminder);

export default router;
