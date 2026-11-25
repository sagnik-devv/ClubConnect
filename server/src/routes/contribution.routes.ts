import { Router } from 'express';
import * as contributionController from '../controllers/contribution.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createContributionSchema,
  updateContributionSchema,
  verifyContributionSchema,
} from '../validators/domain.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', contributionController.listContributions);
router.get('/:id', contributionController.getContribution);
router.post(
  '/',
  validateRequest({ body: createContributionSchema }),
  contributionController.submitContribution
);
router.patch(
  '/:id',
  validateRequest({ body: updateContributionSchema }),
  contributionController.updateContribution
);
router.patch(
  '/:id/verify',
  validateRequest({ body: verifyContributionSchema }),
  contributionController.verifyContribution
);

export default router;
