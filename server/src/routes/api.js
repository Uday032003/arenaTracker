import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import itemsRoutes from '../modules/items/items.routes.js';
import variantsRoutes from '../modules/variants/variants.routes.js';
import activitiesRoutes from '../modules/activities/activities.routes.js';
import sessionsRoutes from '../modules/sessions/sessions.routes.js';
import placesRoutes from '../modules/places/places.routes.js';
import favoritesRoutes from '../modules/favorites/favorites.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import insightsRoutes from '../modules/insights/insights.routes.js';
import categoriesRoutes from '../modules/categories/categories.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import remindersRoutes from '../modules/reminders/reminders.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemsRoutes);
router.use('/variants', variantsRoutes);
router.use('/activities', activitiesRoutes);
router.use('/history', activitiesRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/places', placesRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/insights', insightsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/settings', settingsRoutes);
router.use('/reminders', remindersRoutes);

export default router;
