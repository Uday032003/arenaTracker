import { Router } from 'express';
import { z } from 'zod';
import { PlacesController } from './places.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

const placeSchema = z.object({
  name: z.string().trim().min(1, 'Place name is required'),
  address: z.string().optional().default(''),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  visitedAt: z.string().optional(),
  notes: z.string().optional().default(''),
});

router.use(requireAuth);

router.get('/session/:sessionId', PlacesController.getPlacesBySessionId);
router.post('/session/:sessionId', validateBody(placeSchema), PlacesController.addPlace);
router.patch('/:id', validateBody(placeSchema.partial()), PlacesController.updatePlace);
router.delete('/:id', PlacesController.deletePlace);

export default router;
