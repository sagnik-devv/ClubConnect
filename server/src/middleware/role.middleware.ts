import { ClubRole, GlobalRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

export const LEADER_ROLES: ClubRole[] = [
  ClubRole.PRESIDENT,
  ClubRole.VICE_PRESIDENT,
  ClubRole.SECRETARY,
  ClubRole.TREASURER,
  ClubRole.COORDINATOR,
];

export function requireGlobalRole(...roles: GlobalRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.globalRole)) {
      return next(new AppError('Insufficient platform permissions', 403));
    }
    next();
  };
}

export async function assertClubRole(
  userId: string,
  globalRole: GlobalRole,
  clubId: string,
  allowedRoles: ClubRole[] = LEADER_ROLES
) {
  if (globalRole === GlobalRole.SUPER_ADMIN) {
    return null;
  }

  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: { userId, clubId },
    },
  });

  if (!membership || membership.status !== 'ACTIVE' || !allowedRoles.includes(membership.role)) {
    throw new AppError('You do not have leadership permission for this club', 403);
  }

  return membership;
}

export async function assertActiveClubMember(
  userId: string,
  globalRole: GlobalRole,
  clubId: string
) {
  if (globalRole === GlobalRole.SUPER_ADMIN) {
    return null;
  }

  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: { userId, clubId },
    },
  });

  if (!membership || membership.status !== 'ACTIVE') {
    throw new AppError('Active club membership is required', 403);
  }

  return membership;
}

export function requireClubRole(allowedRoles: ClubRole[] = LEADER_ROLES, paramName = 'id') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const rawParam = req.params[paramName];
      const clubId = (Array.isArray(rawParam) ? rawParam[0] : rawParam) || req.body?.clubId;
      if (!clubId) {
        throw new AppError('Club identifier is required', 400);
      }
      await assertClubRole(req.user.id, req.user.globalRole, clubId, allowedRoles);
      next();
    } catch (err) {
      next(err);
    }
  };
}
