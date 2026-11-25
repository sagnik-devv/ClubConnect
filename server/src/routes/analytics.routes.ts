import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/platform', analyticsController.getPlatformAnalytics);
router.get('/student', requireAuth, analyticsController.getStudentAnalytics);

export default router;
