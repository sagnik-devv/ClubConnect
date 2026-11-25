import { NextFunction, Request, Response } from 'express';
import { ContributionStatus } from '@prisma/client';
import * as contributionService from '../services/contribution.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function listContributions(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await contributionService.listContributions(
      req.user!.id,
      req.user!.globalRole,
      {
        clubId: (getParam(req, 'clubId') || req.query.clubId) as string | undefined,
        userId: (getParam(req, 'userId') || req.query.userId) as string | undefined,
        status: req.query.status as ContributionStatus | undefined,
      }
    );
    return sendSuccess(res, items, 'Contributions retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getContribution(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await contributionService.getContributionById(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, item, 'Contribution retrieved');
  } catch (err) {
    next(err);
  }
}

export async function submitContribution(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await contributionService.submitContribution(
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, item, 'Contribution submitted for verification', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateContribution(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await contributionService.updateContribution(
      getParam(req, 'id'),
      req.user!.id,
      req.body
    );
    return sendSuccess(res, item, 'Contribution updated');
  } catch (err) {
    next(err);
  }
}

export async function verifyContribution(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await contributionService.verifyContribution(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, item, 'Contribution review recorded');
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const board = await contributionService.getClubLeaderboard(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, board, 'Club contribution leaderboard retrieved');
  } catch (err) {
    next(err);
  }
}
