import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export const USER_SAFE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  profileImage: true,
  department: true,
  course: true,
  yearOfStudy: true,
  bio: true,
  skills: true,
  interests: true,
  globalRole: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

function extractToken(req: Request): string | null {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: USER_SAFE_SELECT,
    });

    if (!user || !user.isActive) {
      throw new AppError('User account not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('Invalid or expired access token', 401));
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: USER_SAFE_SELECT,
    });
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}
