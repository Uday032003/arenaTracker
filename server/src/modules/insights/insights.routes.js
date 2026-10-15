import { Router } from 'express';
import { InsightsController } from './insights.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', InsightsController.getInsights);

export default router;
