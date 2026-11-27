import { ClubRole, GlobalRole, MembershipStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { assertClubRole, LEADER_ROLES } from '../middleware/role.middleware.js';
import { createManyNotifications, createNotification } from './notification.service.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'club';
  let candidate = base;
  let counter = 1;
  while (await prisma.club.findUnique({ where: { slug: candidate } })) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}

export async function listClubs(query: {
  search?: string;
  category?: string;
  recruiting?: string;
  interest?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  const skip = (page - 1) * limit;

  const where: Prisma.ClubWhereInput = {
    isActive: true,
  };

  if (query.search?.trim()) {
    const q = query.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { skills: { has: q } },
    ];
  }

  if (query.category && query.category !== 'All') {
    where.category = query.category;
  }

  if (query.recruiting === 'true' || query.recruiting === 'Open') {
    where.isRecruiting = true;
  } else if (query.recruiting === 'false' || query.recruiting === 'Closed') {
    where.isRecruiting = false;
  }

  if (query.interest && query.interest !== 'All') {
    where.interests = { has: query.interest };
  }

  let orderBy: Prisma.ClubOrderByWithRelationInput = { createdAt: 'desc' };
  if (query.sort === 'name') {
    orderBy = { name: 'asc' };
  } else if (query.sort === 'recruiting') {
    orderBy = { isRecruiting: 'desc' };
  } else if (query.sort === 'members') {
    orderBy = { memberships: { _count: 'desc' } };
  }

  const [total, clubs] = await Promise.all([
    prisma.club.count({ where }),
    prisma.club.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            memberships: { where: { status: MembershipStatus.ACTIVE } },
            events: { where: { status: 'UPCOMING' } },
          },
        },
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE,
            role: { in: LEADER_ROLES },
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
                department: true,
                yearOfStudy: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    items: clubs.map((club) => ({
      ...club,
      memberCount: club._count.memberships,
      upcomingEventsCount: club._count.events,
      leadership: club.memberships.map((m) => ({
        membershipId: m.id,
        role: m.role,
        user: m.user,
      })),
      memberships: undefined,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getClubByIdOrSlug(idOrSlug: string, currentUserId?: string) {
  const club = await prisma.club.findFirst({
    where: {
      isActive: true,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      _count: {
        select: {
          memberships: { where: { status: MembershipStatus.ACTIVE } },
        },
      },
      memberships: {
        where: {
          status: MembershipStatus.ACTIVE,
          role: { in: LEADER_ROLES },
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              department: true,
              yearOfStudy: true,
            },
          },
        },
      },
      events: {
        where: { status: { in: ['UPCOMING', 'ONGOING'] } },
        orderBy: { startDate: 'asc' },
        take: 5,
      },
    },
  });

  if (!club) {
    throw new AppError('Club not found', 404);
  }

  let userMembership = null;
  let userApplication = null;

  if (currentUserId) {
    userMembership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: currentUserId, clubId: club.id } },
    });
    userApplication = await prisma.recruitmentApplication.findFirst({
      where: { userId: currentUserId, clubId: club.id },
      orderBy: { appliedAt: 'desc' },
    });
  }

  return {
    ...club,
    memberCount: club._count.memberships,
    leadership: club.memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      user: m.user,
    })),
    userMembership,
    userApplication,
    memberships: undefined,
    _count: undefined,
  };
}

const DEFAULT_CLUB_AVATARS = [
  'club-avatar:code',
  'club-avatar:robo',
  'club-avatar:lens',
  'club-avatar:music',
  'club-avatar:rocket',
  'club-avatar:palette',
  'club-avatar:bolt',
  'club-avatar:trophy',
];

export async function createClub(
  creatorId: string,
  data: {
    name: string;
    description: string;
    shortDescription: string;
    category: string;
    logo?: string | null;
    accentColor?: string;
    mission?: string;
    meetingSchedule?: string;
    expectedTimeCommitment?: string;
    requirements?: string[];
    skills?: string[];
    interests?: string[];
    location?: string;
    isRecruiting?: boolean;
  }
) {
  const slug = await generateUniqueSlug(data.name);
  const defaultLogo =
    data.logo ?? DEFAULT_CLUB_AVATARS[Math.floor(Math.random() * DEFAULT_CLUB_AVATARS.length)];

  return prisma.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: {
        ...data,
        logo: defaultLogo,
        slug,
        createdById: creatorId,
      },
    });

    await tx.clubMembership.create({
      data: {
        userId: creatorId,
        clubId: club.id,
        role: ClubRole.PRESIDENT,
        status: MembershipStatus.ACTIVE,
      },
    });

    return club;
  });
}

export async function updateClub(
  clubId: string,
  actorId: string,
  actorGlobalRole: GlobalRole,
  data: Prisma.ClubUpdateInput
) {
  await assertClubRole(actorId, actorGlobalRole, clubId, LEADER_ROLES);
  return prisma.club.update({
    where: { id: clubId },
    data,
  });
}

export async function deactivateClub(
  clubId: string,
  actorId: string,
  actorGlobalRole: GlobalRole
) {
  await assertClubRole(actorId, actorGlobalRole, clubId, [ClubRole.PRESIDENT]);
  return prisma.club.update({
    where: { id: clubId },
    data: { isActive: false },
  });
}

export async function joinClubRequest(clubId: string, userId: string) {
  const club = await prisma.club.findFirst({
    where: { id: clubId, isActive: true },
  });
  if (!club) throw new AppError('Club not found', 404);

  const existing = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId, clubId } },
  });

  if (existing) {
    if (existing.status === MembershipStatus.ACTIVE) {
      throw new AppError('You are already an active member of this club', 409);
    }
    if (existing.status === MembershipStatus.PENDING) {
      throw new AppError('You already have a pending membership request for this club', 409);
    }
  }

  const membership = existing
    ? await prisma.clubMembership.update({
        where: { id: existing.id },
        data: { status: MembershipStatus.PENDING, role: ClubRole.MEMBER },
      })
    : await prisma.clubMembership.create({
        data: {
          userId,
          clubId,
          role: ClubRole.MEMBER,
          status: MembershipStatus.PENDING,
        },
      });

  const leaders = await prisma.clubMembership.findMany({
    where: { clubId, status: MembershipStatus.ACTIVE, role: { in: LEADER_ROLES } },
  });

  await createManyNotifications(
    leaders.map((l) => ({
      userId: l.userId,
      title: `New membership request in ${club.name}`,
      message: 'A student requested to join your club.',
      type: 'APPLICATION_SUBMITTED',
      relatedEntityId: membership.id,
      relatedEntityType: 'ClubMembership',
    }))
  );

  return membership;
}

export async function leaveClub(clubId: string, userId: string) {
  const membership = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId, clubId } },
  });

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    throw new AppError('You are not an active member of this club', 404);
  }

  if (membership.role === ClubRole.PRESIDENT) {
    const otherPresidents = await prisma.clubMembership.count({
      where: {
        clubId,
        status: MembershipStatus.ACTIVE,
        role: ClubRole.PRESIDENT,
        userId: { not: userId },
      },
    });
    if (otherPresidents === 0) {
      throw new AppError(
        'Transfer presidency to another active member before leaving the club',
        400
      );
    }
  }

  return prisma.clubMembership.update({
    where: { id: membership.id },
    data: { status: MembershipStatus.LEFT },
  });
}

export async function getClubMembers(
  clubId: string,
  actorId: string,
  actorGlobalRole: GlobalRole
) {
  await assertClubRole(actorId, actorGlobalRole, clubId, [
    ClubRole.MEMBER,
    ...LEADER_ROLES,
  ]);

  const members = await prisma.clubMembership.findMany({
    where: { clubId, status: MembershipStatus.ACTIVE },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
          department: true,
          course: true,
          yearOfStudy: true,
          skills: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return members;
}

export async function listMembershipRequests(
  clubId: string,
  actorId: string,
  actorGlobalRole: GlobalRole
) {
  await assertClubRole(actorId, actorGlobalRole, clubId, LEADER_ROLES);

  return prisma.clubMembership.findMany({
    where: { clubId, status: MembershipStatus.PENDING },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          department: true,
          course: true,
          yearOfStudy: true,
          skills: true,
          interests: true,
          bio: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}

export async function updateMembershipRequest(
  clubId: string,
  requestId: string,
  actorId: string,
  actorGlobalRole: GlobalRole,
  payload: { status: MembershipStatus; role?: ClubRole; reason?: string }
) {
  await assertClubRole(actorId, actorGlobalRole, clubId, LEADER_ROLES);

  const membership = await prisma.clubMembership.findUnique({
    where: { id: requestId },
    include: { club: true },
  });

  if (!membership || membership.clubId !== clubId) {
    throw new AppError('Membership record not found for this club', 404);
  }

  if (membership.userId === actorId && payload.status === MembershipStatus.ACTIVE && membership.status === MembershipStatus.PENDING) {
    throw new AppError('You cannot approve your own membership request', 403);
  }

  const updated = await prisma.clubMembership.update({
    where: { id: requestId },
    data: {
      status: payload.status,
      ...(payload.role ? { role: payload.role } : {}),
    },
  });

  await createNotification({
    userId: membership.userId,
    title:
      payload.status === MembershipStatus.ACTIVE
        ? `Welcome to ${membership.club.name}`
        : `Membership update for ${membership.club.name}`,
    message:
      payload.status === MembershipStatus.ACTIVE
        ? `Your membership in ${membership.club.name} is now active.`
        : `Your membership status was updated to ${payload.status}.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
    type: 'APPLICATION_DECISION',
    relatedEntityId: membership.clubId,
    relatedEntityType: 'Club',
  });

  return updated;
}
