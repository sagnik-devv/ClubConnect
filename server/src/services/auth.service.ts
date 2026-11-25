import bcrypt from 'bcryptjs';
import { GlobalRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { USER_SAFE_SELECT } from '../middleware/auth.middleware.js';
import { createNotification } from './notification.service.js';

const SALT_ROUNDS = 12;

function getRefreshExpiryDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export async function issueSessionTokens(user: {
  id: string;
  email: string;
  globalRole: GlobalRole;
}) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    globalRole: user.globalRole,
  });
  const { token: refreshToken } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  department: string;
  course: string;
  yearOfStudy: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      department: input.department,
      course: input.course,
      yearOfStudy: input.yearOfStudy,
      globalRole: GlobalRole.STUDENT,
    },
    select: USER_SAFE_SELECT,
  });

  await createNotification({
    userId: user.id,
    title: 'Welcome to ClubConnect',
    message: 'Your account is ready. Explore campus clubs and apply transparently.',
    type: 'REGISTRATION',
    relatedEntityId: user.id,
    relatedEntityType: 'User',
  });

  const tokens = await issueSessionTokens(user);
  const memberships = await getUserMemberships(user.id);

  return { user: { ...user, memberships }, ...tokens };
}

export async function loginUser(input: { email: string; password: string }) {
  const userRecord = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!userRecord || !userRecord.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(input.password, userRecord.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await issueSessionTokens(userRecord);
  const safeUser = await prisma.user.findUniqueOrThrow({
    where: { id: userRecord.id },
    select: USER_SAFE_SELECT,
  });
  const memberships = await getUserMemberships(userRecord.id);

  return { user: { ...safeUser, memberships }, ...tokens };
}

export async function rotateRefreshToken(rawRefreshToken: string) {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token missing', 401);
  }

  let decoded: { sub: string; jti: string };
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: USER_SAFE_SELECT } },
  });

  if (!stored) {
    throw new AppError('Refresh token not recognized', 401);
  }

  if (stored.revokedAt) {
    // Token reuse detected — revoke all active refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError('Refresh token was already revoked', 401);
  }

  if (stored.expiresAt <= new Date() || !stored.user.isActive || stored.userId !== decoded.sub) {
    throw new AppError('Refresh token expired', 401);
  }

  const newAccessToken = signAccessToken({
    sub: stored.user.id,
    email: stored.user.email,
    globalRole: stored.user.globalRole,
  });
  const { token: newRefreshToken } = signRefreshToken(stored.user.id);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: stored.user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: getRefreshExpiryDate(),
      },
    }),
  ]);

  const memberships = await getUserMemberships(stored.user.id);
  return {
    user: { ...stored.user, memberships },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(rawRefreshToken?: string) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function getUserMemberships(userId: string) {
  return prisma.clubMembership.findMany({
    where: { userId, status: { in: ['ACTIVE', 'PENDING'] } },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          accentColor: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}
