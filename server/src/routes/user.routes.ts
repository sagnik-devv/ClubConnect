import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as recruitmentController from '../controllers/recruitment.controller.js';
import * as eventController from '../controllers/event.controller.js';
import * as contributionController from '../controllers/contribution.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { avatarUpload } from '../middleware/upload.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { changePasswordSchema } from '../validators/auth.validator.js';
import { updateProfileSchema } from '../validators/domain.validator.js';

const router = Router();

router.get('/me', requireAuth, userController.getMe);
router.patch('/me', requireAuth, validateRequest({ body: updateProfileSchema }), userController.updateMe);
router.patch(
  '/me/password',
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  userController.updatePassword
);
router.post('/me/avatar', requireAuth, avatarUpload.single('avatar'), userController.uploadAvatar);

router.get('/me/applications', requireAuth, recruitmentController.listMyApplications);
router.get('/me/events', requireAuth, eventController.listMyEvents);

router.get('/:userId/contributions', requireAuth, contributionController.listContributions);
router.get('/:id/public-profile', userController.getPublicProfile);

export default router;
