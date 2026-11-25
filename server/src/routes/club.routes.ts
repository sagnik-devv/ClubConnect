import { Router } from 'express';
import * as clubController from '../controllers/club.controller.js';
import * as taskController from '../controllers/task.controller.js';
import * as contributionController from '../controllers/contribution.controller.js';
import * as recruitmentController from '../controllers/recruitment.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createClubSchema,
  updateClubSchema,
  updateMembershipRequestSchema,
} from '../validators/club.validator.js';
import { createApplicationSchema } from '../validators/domain.validator.js';

const router = Router();

router.get('/', clubController.listClubs);
router.get('/:id', optionalAuth, clubController.getClub);
router.post('/', requireAuth, validateRequest({ body: createClubSchema }), clubController.createClub);
router.patch('/:id', requireAuth, validateRequest({ body: updateClubSchema }), clubController.updateClub);
router.delete('/:id', requireAuth, clubController.deleteClub);

router.get('/:id/members', requireAuth, clubController.getClubMembers);
router.get('/:id/statistics', requireAuth, clubController.getClubStatistics);
router.post('/:id/join', requireAuth, clubController.joinClub);
router.post('/:id/leave', requireAuth, clubController.leaveClub);
router.get('/:id/membership-requests', requireAuth, clubController.listMembershipRequests);
router.patch(
  '/:id/membership-requests/:requestId',
  requireAuth,
  validateRequest({ body: updateMembershipRequestSchema }),
  clubController.reviewMembershipRequest
);

// Club-scoped nested routes from specification
router.get('/:clubId/tasks', requireAuth, taskController.listTasks);
router.get('/:clubId/contributions', requireAuth, contributionController.listContributions);
router.get('/:clubId/leaderboard', requireAuth, contributionController.getLeaderboard);
router.post(
  '/:clubId/applications',
  requireAuth,
  validateRequest({ body: createApplicationSchema }),
  recruitmentController.submitApplication
);
router.get('/:clubId/applications', requireAuth, recruitmentController.listClubApplications);

export default router;
