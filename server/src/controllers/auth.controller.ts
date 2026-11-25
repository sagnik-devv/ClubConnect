import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { USER_SAFE_SELECT } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateCsrfToken } from '../utils/jwt.js';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = env.NODE_ENV === 'production';
  const csrfToken = generateCsrfToken();

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.cookie('clubconnect_csrf', csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return csrfToken;
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('clubconnect_csrf', { path: '/' });
}

export function getCsrfToken(req: Request, res: Response) {
  const existing = req.cookies?.clubconnect_csrf;
  const csrfToken = existing || generateCsrfToken();
  if (!existing) {
    res.cookie('clubconnect_csrf', csrfToken, {
      httpOnly: false,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  return sendSuccess(res, { csrfToken }, 'CSRF token issued');
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.registerUser(req.body);
    const csrfToken = setAuthCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(
      res,
      { user: result.user, csrfToken },
      'Account created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginUser(req.body);
    const csrfToken = setAuthCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, { user: result.user, csrfToken }, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefresh = req.cookies?.refreshToken;
    const result = await authService.rotateRefreshToken(rawRefresh);
    const csrfToken = setAuthCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, { user: result.user, csrfToken }, 'Session refreshed');
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logoutUser(req.cookies?.refreshToken);
    clearAuthCookies(res);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: USER_SAFE_SELECT,
    });
    const memberships = await authService.getUserMemberships(req.user!.id);
    return sendSuccess(res, { user: { ...user, memberships } }, 'Current session retrieved');
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.changeUserPassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    clearAuthCookies(res);
    return sendSuccess(res, null, 'Password updated. Please sign in again.');
  } catch (err) {
    next(err);
  }
}
