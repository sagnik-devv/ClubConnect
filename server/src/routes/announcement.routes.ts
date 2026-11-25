import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as announcementService from '../services/announcement.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await announcementService.listMemberAnnouncements(req.user!.id);
    return sendSuccess(res, items, 'Club announcements retrieved');
  } catch (err) {
    next(err);
  }
});

export default router;
