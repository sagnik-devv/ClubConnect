import { Router } from 'express';
import * as recruitmentController from '../controllers/recruitment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  updateApplicationNotesSchema,
  updateApplicationStatusSchema,
} from '../validators/domain.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', recruitmentController.getRecruitmentOverview);
router.get('/:id', recruitmentController.getApplication);
router.patch(
  '/:id/status',
  validateRequest({ body: updateApplicationStatusSchema }),
  recruitmentController.updateStatus
);
router.patch(
  '/:id/notes',
  validateRequest({ body: updateApplicationNotesSchema }),
  recruitmentController.updateNotes
);
router.patch('/:id/onboarding', recruitmentController.updateOnboarding);

export default router;
