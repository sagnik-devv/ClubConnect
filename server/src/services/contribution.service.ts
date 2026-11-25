import {
  ContributionStatus,
  ContributionType,
  GlobalRole,
  MembershipStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import {
  assertActiveClubMember,
  assertClubRole,
  LEADER_ROLES,
} from '../middleware/role.middleware.js';
import { createManyNotifications, createNotification } from './notification.service.js';

export const DEFAULT_CONTRIBUTION_POINTS: Record<ContributionType, number> = {
  TASK: 20,
  EVENT: 15,
  PROJECT: 30,
  LEADERSHIP: 25,
  VOLUNTEERING: 15,
  OTHER: 10,
};

export async function listContributions(
  actorId: string,
  globalRole: GlobalRole,
  query: { clubId?: string; userId?: string; status?: ContributionStatus }
) {
  const where: Prisma.ContributionWhereInput = {};

  if (globalRole !== GlobalRole.SUPER_ADMIN) {
    const memberships = await prisma.clubMembership.findMany({
      where: { userId: actorId, status: MembershipStatus.ACTIVE },
      select: { clubId: true, role: true },
    });
    const memberClubIds = memberships.map((m) => m.clubId);
    const leaderClubIds = memberships
      .filter((m) => LEADER_ROLES.includes(m.role))
      .map((m) => m.clubId);

    if (query.clubId) {
      if (!memberClubIds.includes(query.clubId)) {
        throw new AppError('Active club membership required', 403);
      }
      where.clubId = query.clubId;
      if (!leaderClubIds.includes(query.clubId)) {
        where.OR = [{ userId: actorId }, { status: ContributionStatus.VERIFIED }];
      }
    } else {
      where.OR = [
        { userId: actorId },
        ...(leaderClubIds.length > 0 ? [{ clubId: { in: leaderClubIds } }] : []),
      ];
    }
  } else if (query.clubId) {
    where.clubId = query.clubId;
  }

  if (query.userId) where.userId = query.userId;
  if (query.status) where.status = query.status;

  return prisma.contribution.findMany({
    where,
    include: {
      club: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, fullName: true, profileImage: true } },
      verifiedBy: { select: { id: true, fullName: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getContributionById(
  id: string,
  actorId: string,
  globalRole: GlobalRole
) {
  const contribution = await prisma.contribution.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true } },
      verifiedBy: { select: { id: true, fullName: true } },
      task: { select: { id: true, title: true } },
    },
  });
  if (!contribution) throw new AppError('Contribution not found', 404);

  if (contribution.userId !== actorId && globalRole !== GlobalRole.SUPER_ADMIN) {
    await assertClubRole(actorId, globalRole, contribution.clubId, LEADER_ROLES);
  }

  return contribution;
}

export async function submitContribution(
  userId: string,
  globalRole: GlobalRole,
  input: {
    clubId: string;
    taskId?: string | null;
    title: string;
    description: string;
    contributionType: ContributionType;
    hoursSpent: number;
  }
) {
  await assertActiveClubMember(userId, globalRole, input.clubId);

  if (input.taskId) {
    const task = await prisma.task.findUnique({ where: { id: input.taskId } });
    if (!task || task.clubId !== input.clubId) {
      throw new AppError('Linked task does not belong to this club', 400);
    }
  }

  const club = await prisma.club.findUniqueOrThrow({ where: { id: input.clubId } });

  const contribution = await prisma.contribution.create({
    data: {
      userId,
      clubId: input.clubId,
      taskId: input.taskId || null,
      title: input.title,
      description: input.description,
      contributionType: input.contributionType,
      hoursSpent: input.hoursSpent,
      points: 0,
      status: ContributionStatus.PENDING,
    },
    include: {
      club: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true } },
    },
  });

  const leaders = await prisma.clubMembership.findMany({
    where: {
      clubId: input.clubId,
      status: MembershipStatus.ACTIVE,
      role: { in: LEADER_ROLES },
      userId: { not: userId },
    },
  });

  await createManyNotifications(
    leaders.map((l) => ({
      userId: l.userId,
      title: `Contribution submitted in ${club.name}`,
      message: `${contribution.user.fullName} submitted "${contribution.title}" for review.`,
      type: 'CONTRIBUTION_SUBMITTED',
      relatedEntityId: contribution.id,
      relatedEntityType: 'Contribution',
    }))
  );

  return contribution;
}

export async function updateContribution(
  id: string,
  actorId: string,
  patch: {
    title?: string;
    description?: string;
    contributionType?: ContributionType;
    hoursSpent?: number;
  }
) {
  const existing = await prisma.contribution.findUnique({ where: { id } });
  if (!existing) throw new AppError('Contribution not found', 404);
  if (existing.userId !== actorId) {
    throw new AppError('You can only edit your own contributions', 403);
  }
  if (existing.status !== ContributionStatus.PENDING) {
    throw new AppError('Only pending contributions can be edited', 400);
  }

  return prisma.contribution.update({
    where: { id },
    data: patch,
  });
}

export async function verifyContribution(
  id: string,
  verifierId: string,
  globalRole: GlobalRole,
  payload: {
    status: 'VERIFIED' | 'REJECTED';
    points?: number;
    reviewNote?: string;
  }
) {
  const existing = await prisma.contribution.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true, contributionPointsConfig: true } },
    },
  });
  if (!existing) throw new AppError('Contribution not found', 404);

  if (existing.userId === verifierId) {
    throw new AppError('You cannot verify or reject your own contribution', 403);
  }

  await assertClubRole(verifierId, globalRole, existing.clubId, LEADER_ROLES);

  const customConfig = existing.club.contributionPointsConfig as Record<string, number> | null;
  const configuredPoints =
    customConfig && typeof customConfig[existing.contributionType] === 'number'
      ? customConfig[existing.contributionType]
      : DEFAULT_CONTRIBUTION_POINTS[existing.contributionType];

  const awardedPoints =
    payload.status === ContributionStatus.VERIFIED
      ? payload.points ?? configuredPoints
      : 0;

  const updated = await prisma.contribution.update({
    where: { id },
    data: {
      status: payload.status,
      points: awardedPoints,
      verifiedById: verifierId,
      reviewNote: payload.reviewNote,
    },
    include: {
      club: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true } },
      verifiedBy: { select: { id: true, fullName: true } },
    },
  });

  await createNotification({
    userId: existing.userId,
    title:
      payload.status === ContributionStatus.VERIFIED
        ? `Contribution verified (+${awardedPoints} pts)`
        : `Contribution rejected in ${existing.club.name}`,
    message:
      payload.status === ContributionStatus.VERIFIED
        ? `"${existing.title}" was verified in ${existing.club.name}.`
        : `"${existing.title}" was rejected.${payload.reviewNote ? ` Note: ${payload.reviewNote}` : ''}`,
    type: 'CONTRIBUTION_REVIEWED',
    relatedEntityId: updated.id,
    relatedEntityType: 'Contribution',
  });

  return updated;
}

export async function getClubLeaderboard(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertActiveClubMember(actorId, globalRole, clubId);

  const verified = await prisma.contribution.groupBy({
    by: ['userId'],
    where: { clubId, status: ContributionStatus.VERIFIED },
    _sum: { points: true, hoursSpent: true },
    _count: { id: true },
    orderBy: { _sum: { points: 'desc' } },
  });

  const userIds = verified.map((v) => v.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, profileImage: true, yearOfStudy: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return verified.map((row) => ({
    user: userMap.get(row.userId) ?? { id: row.userId, fullName: 'Member', profileImage: null, yearOfStudy: null },
    totalPoints: row._sum.points ?? 0,
    totalHours: Number((row._sum.hoursSpent ?? 0).toFixed(1)),
    verifiedCount: row._count.id,
  }));
}
