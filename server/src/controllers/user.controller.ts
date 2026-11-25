import { NextFunction, Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import * as authService from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getCurrentUserProfile(req.user!.id);
    return sendSuccess(res, profile, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await userService.updateCurrentUserProfile(req.user!.id, req.body);
    return sendSuccess(res, updated, 'Profile updated');
  } catch (err) {
    next(err);
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.changeUserPassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    return sendSuccess(res, null, 'Password updated');
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('Image file is required', 400);
    }
    const avatarPath = `/uploads/${req.file.filename}`;
    const updated = await userService.updateUserAvatar(req.user!.id, avatarPath);
    return sendSuccess(res, updated, 'Profile avatar updated');
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getPublicUserProfile(getParam(req, 'id'));
    return sendSuccess(res, profile, 'Public profile retrieved');
  } catch (err) {
    next(err);
  }
}
