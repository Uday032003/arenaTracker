import { Router } from 'express';
import { z } from 'zod';
import { FavoritesController } from './favorites.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const pinSchema = z.object({
  itemId: z.string().uuid('Valid item ID required'),
});

router.use(requireAuth);

router.get('/', FavoritesController.getFavorites);
router.post('/', validateBody(pinSchema), FavoritesController.pinItem);
router.delete('/:itemId', FavoritesController.unpinItem);

export default router;
