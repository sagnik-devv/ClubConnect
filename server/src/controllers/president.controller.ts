import { NextFunction, Request, Response } from 'express';
import * as presidentService from '../services/president.service.js';
import * as announcementService from '../services/announcement.service.js';
import * as clubService from '../services/club.service.js';
import * as taskService from '../services/task.service.js';
import * as contributionService from '../services/contribution.service.js';
import * as recruitmentService from '../services/recruitment.service.js';
import * as eventService from '../services/event.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await presidentService.getPresidentDashboard(
      req.user!.id,
      req.user!.globalRole,
      req.query.clubId as string | undefined
    );
    return sendSuccess(res, data, 'President dashboard retrieved');
  } catch (err) {
    next(err);
  }
}

export async function listClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const clubs = await presidentService.listAuthorizedClubs(
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, clubs, 'Authorized clubs retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getClub(req: Request, res: Response, next: NextFunction) {
  try {
    const club = await presidentService.getAuthorizedClub(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, club, 'Club details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await presidentService.listClubMembersDetailed(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole,
      {
        search: req.query.search as string | undefined,
        role: req.query.role as string | undefined,
        status: req.query.status as string | undefined,
        sort: req.query.sort as string | undefined,
      }
    );
    return sendSuccess(res, members, 'Club members retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getMemberDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const detail = await presidentService.getClubMemberDetail(
      getParam(req, 'clubId'),
      getParam(req, 'memberId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, detail, 'Member details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await presidentService.updateClubMember(
      getParam(req, 'clubId'),
      getParam(req, 'memberId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, updated, 'Club member updated');
  } catch (err) {
    next(err);
  }
}

export async function listMembershipRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await clubService.listMembershipRequests(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, requests, 'Membership requests retrieved');
  } catch (err) {
    next(err);
  }
}

export async function reviewMembershipRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await clubService.updateMembershipRequest(
      getParam(req, 'clubId'),
      getParam(req, 'requestId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, updated, 'Membership request reviewed');
  } catch (err) {
    next(err);
  }
}

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await presidentService.getPresidentTasksWithWorkload(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, data, 'Club tasks and workload retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.createTask(req.user!.id, req.user!.globalRole, {
      ...req.body,
      clubId: getParam(req, 'clubId'),
    });
    return sendSuccess(res, task, 'Task created', 201);
  } catch (err) {
    next(err);
  }
}

export async function listContributions(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await contributionService.listContributions(
      req.user!.id,
      req.user!.globalRole,
      { clubId: getParam(req, 'clubId') }
    );
    return sendSuccess(res, items, 'Club contributions retrieved');
  } catch (err) {
    next(err);
  }
}

export async function verifyContribution(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await contributionService.verifyContribution(
      getParam(req, 'contributionId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, item, 'Contribution verification updated');
  } catch (err) {
    next(err);
  }
}

export async function listRecruitment(req: Request, res: Response, next: NextFunction) {
  try {
    const apps = await recruitmentService.listClubApplications(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, apps, 'Club recruitment applications retrieved');
  } catch (err) {
    next(err);
  }
}

export async function updateRecruitmentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await recruitmentService.updateApplicationStatus(
      getParam(req, 'applicationId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, updated, 'Application status updated');
  } catch (err) {
    next(err);
  }
}

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await presidentService.listClubEventsForPresident(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, events, 'Club events retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const ev = await eventService.createEvent(req.user!.id, req.user!.globalRole, {
      ...req.body,
      clubId: getParam(req, 'clubId'),
    });
    return sendSuccess(res, ev, 'Event created', 201);
  } catch (err) {
    next(err);
  }
}

export async function listAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await announcementService.listClubAnnouncements(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, items, 'Announcements retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await announcementService.createClubAnnouncement(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, item, 'Announcement published', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await announcementService.updateAnnouncement(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, item, 'Announcement updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    await announcementService.deleteAnnouncement(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await presidentService.getPresidentAnalytics(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole,
      {
        range: req.query.range as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      }
    );
    return sendSuccess(res, data, 'Club analytics retrieved');
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await presidentService.updateClubSettings(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, updated, 'Club settings saved');
  } catch (err) {
    next(err);
  }
}
