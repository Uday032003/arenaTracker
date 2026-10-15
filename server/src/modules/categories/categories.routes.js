import { Router } from 'express';
import { z } from 'zod';
import { CategoriesController } from './categories.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  icon: z.string().optional().default('Folder'),
  color: z.string().optional().default('#22c55e'),
});

router.use(requireAuth);

router.get('/', CategoriesController.getCategories);
router.post('/', validateBody(categorySchema), CategoriesController.createCategory);
router.patch('/:id', validateBody(categorySchema.partial()), CategoriesController.updateCategory);
router.delete('/:id', CategoriesController.deleteCategory);

export default router;
