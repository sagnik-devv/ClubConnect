import { ClubRole, GlobalRole, MembershipStatus } from '@prisma/client';
import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireAuth, USER_SAFE_SELECT } from '../middleware/auth.middleware.js';
import { requireGlobalRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

const router = Router();
router.use(requireAuth, requireGlobalRole(GlobalRole.SUPER_ADMIN));

router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [usersCount, clubsCount, tasksCount, contributionsCount, eventsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.club.count({ where: { isActive: true } }),
        prisma.task.count(),
        prisma.contribution.count(),
        prisma.event.count(),
      ]);
    return sendSuccess(
      res,
      { usersCount, clubsCount, tasksCount, contributionsCount, eventsCount },
      'Platform admin overview retrieved'
    );
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, users, 'Platform users retrieved');
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/users/:id/status',
  validateRequest({ body: z.object({ isActive: z.boolean() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await prisma.user.update({
        where: { id: getParam(req, 'id') },
        data: { isActive: req.body.isActive },
        select: USER_SAFE_SELECT,
      });
      return sendSuccess(res, updated, 'User status updated');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/clubs/:clubId/assign-leader',
  validateRequest({
    body: z.object({
      userId: z.string().uuid(),
      role: z.nativeEnum(ClubRole),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clubId = getParam(req, 'clubId');
      const membership = await prisma.clubMembership.upsert({
        where: {
          userId_clubId: { userId: req.body.userId, clubId },
        },
        update: {
          role: req.body.role,
          status: MembershipStatus.ACTIVE,
        },
        create: {
          userId: req.body.userId,
          clubId,
          role: req.body.role,
          status: MembershipStatus.ACTIVE,
        },
      });
      return sendSuccess(res, membership, 'Club leadership assigned');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
