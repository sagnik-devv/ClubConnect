import { NextFunction, Request, Response } from 'express';
import * as clubService from '../services/club.service.js';
import * as analyticsService from '../services/analytics.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function listClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await clubService.listClubs({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      recruiting: req.query.recruiting as string | undefined,
      interest: req.query.interest as string | undefined,
      sort: req.query.sort as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return sendSuccess(res, data, 'Clubs retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getClub(req: Request, res: Response, next: NextFunction) {
  try {
    const club = await clubService.getClubByIdOrSlug(getParam(req, 'id'), req.user?.id);
    return sendSuccess(res, club, 'Club retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createClub(req: Request, res: Response, next: NextFunction) {
  try {
    const club = await clubService.createClub(req.user!.id, req.body);
    return sendSuccess(res, club, 'Club created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateClub(req: Request, res: Response, next: NextFunction) {
  try {
    const club = await clubService.updateClub(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, club, 'Club updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteClub(req: Request, res: Response, next: NextFunction) {
  try {
    await clubService.deactivateClub(getParam(req, 'id'), req.user!.id, req.user!.globalRole);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getClubMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await clubService.getClubMembers(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, members, 'Club members retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getClubStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await analyticsService.getClubManagementAnalytics(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, stats, 'Club statistics retrieved');
  } catch (err) {
    next(err);
  }
}

export async function joinClub(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = await clubService.joinClubRequest(getParam(req, 'id'), req.user!.id);
    return sendSuccess(res, membership, 'Membership request submitted', 201);
  } catch (err) {
    next(err);
  }
}

export async function leaveClub(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = await clubService.leaveClub(getParam(req, 'id'), req.user!.id);
    return sendSuccess(res, membership, 'Left club successfully');
  } catch (err) {
    next(err);
  }
}

export async function listMembershipRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await clubService.listMembershipRequests(
      getParam(req, 'id'),
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
      getParam(req, 'id'),
      getParam(req, 'requestId'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, updated, 'Membership request updated');
  } catch (err) {
    next(err);
  }
}
