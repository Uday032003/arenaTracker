import { Router } from 'express';
import { z } from 'zod';
import { ItemsController } from './items.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().optional().default(''),
  trackingType: z.enum(['general', 'timed', 'trip', 'call', 'receivable']).default('general'),
  targetAmount: z.union([z.number(), z.string(), z.null()]).optional(),
  currency: z.string().optional().default('₹'),
  icon: z.string().optional().default('Activity'),
  color: z.string().optional().default('#22c55e'),
});

const updateItemSchema = z.object({
  name: z.string().trim().min(1).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  trackingType: z.enum(['general', 'timed', 'trip', 'call', 'receivable']).optional(),
  targetAmount: z.union([z.number(), z.string(), z.null()]).optional(),
  currency: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isArchived: z.boolean().optional(),
});

router.use(requireAuth);

router.get('/', ItemsController.getItems);
router.post('/', validateBody(createItemSchema), ItemsController.createItem);
router.get('/:id', ItemsController.getItemById);
router.patch('/:id', validateBody(updateItemSchema), ItemsController.updateItem);
router.delete('/:id', ItemsController.deleteItem);
router.patch('/:id/archive', ItemsController.archiveItem);
router.get('/:id/stats', ItemsController.getItemStats);

export default router;
