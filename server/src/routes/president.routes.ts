import { Router } from 'express';
import * as presidentController from '../controllers/president.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  updateApplicationStatusSchema,
  verifyContributionSchema,
} from '../validators/domain.validator.js';
import {
  createAnnouncementSchema,
  membershipDecisionSchema,
  presidentCreateEventSchema,
  presidentCreateTaskSchema,
  updateAnnouncementSchema,
  updateClubSettingsSchema,
  updateMemberSchema,
} from '../validators/president.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', presidentController.getDashboard);
router.get('/clubs', presidentController.listClubs);
router.get('/clubs/:clubId', presidentController.getClub);

router.get('/clubs/:clubId/members', presidentController.listMembers);
router.get('/clubs/:clubId/members/:memberId', presidentController.getMemberDetail);
router.patch(
  '/clubs/:clubId/members/:memberId',
  validateRequest({ body: updateMemberSchema }),
  presidentController.updateMember
);

router.get('/clubs/:clubId/membership-requests', presidentController.listMembershipRequests);
router.patch(
  '/clubs/:clubId/membership-requests/:requestId',
  validateRequest({ body: membershipDecisionSchema }),
  presidentController.reviewMembershipRequest
);

router.get('/clubs/:clubId/tasks', presidentController.listTasks);
router.post(
  '/clubs/:clubId/tasks',
  validateRequest({ body: presidentCreateTaskSchema }),
  presidentController.createTask
);

router.get('/clubs/:clubId/contributions', presidentController.listContributions);
router.patch(
  '/contributions/:contributionId/verify',
  validateRequest({ body: verifyContributionSchema }),
  presidentController.verifyContribution
);

router.get('/clubs/:clubId/recruitment', presidentController.listRecruitment);
router.patch(
  '/recruitment/:applicationId/status',
  validateRequest({ body: updateApplicationStatusSchema }),
  presidentController.updateRecruitmentStatus
);

router.get('/clubs/:clubId/events', presidentController.listEvents);
router.post(
  '/clubs/:clubId/events',
  validateRequest({ body: presidentCreateEventSchema }),
  presidentController.createEvent
);

router.get('/clubs/:clubId/announcements', presidentController.listAnnouncements);
router.post(
  '/clubs/:clubId/announcements',
  validateRequest({ body: createAnnouncementSchema }),
  presidentController.createAnnouncement
);
router.patch(
  '/announcements/:id',
  validateRequest({ body: updateAnnouncementSchema }),
  presidentController.updateAnnouncement
);
router.delete('/announcements/:id', presidentController.deleteAnnouncement);

router.get('/clubs/:clubId/analytics', presidentController.getAnalytics);
router.patch(
  '/clubs/:clubId/settings',
  validateRequest({ body: updateClubSettingsSchema }),
  presidentController.updateSettings
);

export default router;
