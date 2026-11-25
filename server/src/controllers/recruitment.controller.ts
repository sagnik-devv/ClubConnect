import { NextFunction, Request, Response } from 'express';
import * as recruitmentService from '../services/recruitment.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function getRecruitmentOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await recruitmentService.listRecruitmentOverview(
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, data, 'Recruitment overview retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const app = await recruitmentService.getApplicationById(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, app, 'Application retrieved');
  } catch (err) {
    next(err);
  }
}

export async function submitApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const app = await recruitmentService.submitApplication(
      getParam(req, 'clubId'),
      req.user!.id,
      req.body
    );
    return sendSuccess(res, app, 'Application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function listClubApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const apps = await recruitmentService.listClubApplications(
      getParam(req, 'clubId'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, apps, 'Club applications retrieved');
  } catch (err) {
    next(err);
  }
}

export async function listMyApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const apps = await recruitmentService.listMyApplications(req.user!.id);
    return sendSuccess(res, apps, 'My applications retrieved');
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await recruitmentService.updateApplicationStatus(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, updated, 'Application status updated');
  } catch (err) {
    next(err);
  }
}

export async function updateNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await recruitmentService.updateApplicationNotes(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body.reviewNotes
    );
    return sendSuccess(res, updated, 'Review notes updated');
  } catch (err) {
    next(err);
  }
}

export async function updateOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await recruitmentService.updateOnboardingStep(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      Number(req.body.onboardingStep)
    );
    return sendSuccess(res, updated, 'Onboarding progress updated');
  } catch (err) {
    next(err);
  }
}
