import { NextFunction, Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function getPlatformAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await analyticsService.getPlatformSummary();
    return sendSuccess(res, summary, 'Platform summary retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getStudentAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getStudentDashboardAnalytics(req.user!.id);
    return sendSuccess(res, data, 'Student dashboard analytics retrieved');
  } catch (err) {
    next(err);
  }
}
