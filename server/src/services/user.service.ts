import { ContributionStatus, MembershipStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { USER_SAFE_SELECT } from '../middleware/auth.middleware.js';
import { AppError } from '../utils/AppError.js';
import { getUserMemberships } from './auth.service.js';

export async function getCurrentUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SAFE_SELECT,
  });
  if (!user) throw new AppError('User not found', 404);

  const [memberships, contributions, taskActivities] = await Promise.all([
    getUserMemberships(userId),
    prisma.contribution.findMany({
      where: { userId, status: ContributionStatus.VERIFIED },
      include: { club: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.taskActivity.findMany({
      where: { userId },
      include: { task: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return { ...user, memberships, verifiedContributions: contributions, taskActivities };
}

export async function updateCurrentUserProfile(
  userId: string,
  data: {
    fullName?: string;
    bio?: string | null;
    department?: string | null;
    course?: string | null;
    yearOfStudy?: string | null;
    skills?: string[];
    interests?: string[];
    profileImage?: string | null;
  }
) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SAFE_SELECT,
  });
  const memberships = await getUserMemberships(userId);
  return { ...updated, memberships };
}

export async function updateUserAvatar(userId: string, avatarPath: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { profileImage: avatarPath },
    select: USER_SAFE_SELECT,
  });
}

export async function getPublicUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      department: true,
      course: true,
      yearOfStudy: true,
      bio: true,
      skills: true,
      interests: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError('User profile not found', 404);

  const [memberships, verifiedContributions] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      include: { club: { select: { id: true, name: true, slug: true, category: true } } },
    }),
    prisma.contribution.findMany({
      where: { userId, status: ContributionStatus.VERIFIED },
      include: { club: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return { ...user, memberships, verifiedContributions };
}
