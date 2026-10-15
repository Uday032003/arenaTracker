import { Router } from 'express';
import { z } from 'zod';
import { VariantsController } from './variants.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const createVariantSchema = z.object({
  name: z.string().trim().min(1, 'Variant name is required'),
  description: z.string().optional().default(''),
});

const updateVariantSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  isArchived: z.boolean().optional(),
});

router.use(requireAuth);

router.get('/item/:itemId', VariantsController.getVariantsByItemId);
router.post('/item/:itemId', validateBody(createVariantSchema), VariantsController.createVariant);
router.patch('/:id', validateBody(updateVariantSchema), VariantsController.updateVariant);
router.delete('/:id', VariantsController.deleteVariant);

export default router;
