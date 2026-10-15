import { Router } from 'express';
import { PushController } from './push.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Endpoint to fetch public VAPID key
router.get('/vapid-public-key', PushController.getPublicKey);

// Authenticated endpoints
router.use(requireAuth);
router.get('/status', PushController.getStatus);
router.post('/subscribe', PushController.subscribe);
router.post('/unsubscribe', PushController.unsubscribe);
router.post('/test', PushController.sendTestPush);

export const pushRoutes = router;
