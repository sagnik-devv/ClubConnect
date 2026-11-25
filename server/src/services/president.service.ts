import {
  ApplicationStatus,
  ClubRole,
  ContributionStatus,
  ContributionType,
  EventStatus,
  GlobalRole,
  MembershipStatus,
  RegistrationStatus,
  TaskStatus,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { assertClubRole, LEADER_ROLES } from '../middleware/role.middleware.js';
import { createNotification } from './notification.service.js';
import { DEFAULT_CONTRIBUTION_POINTS } from './contribution.service.js';

export async function listAuthorizedClubs(userId: string, globalRole: GlobalRole) {
  const clubs = await prisma.club.findMany({
    where:
      globalRole === GlobalRole.SUPER_ADMIN
        ? { isActive: true }
        : {
            isActive: true,
            memberships: {
              some: {
                userId,
                status: MembershipStatus.ACTIVE,
                role: { in: LEADER_ROLES },
              },
            },
          },
    include: {
      memberships: {
        where: { userId, status: MembershipStatus.ACTIVE },
        select: { role: true },
      },
      _count: {
        select: {
          memberships: { where: { status: MembershipStatus.ACTIVE } },
          tasks: { where: { status: { not: TaskStatus.COMPLETED } } },
          events: { where: { status: EventStatus.UPCOMING } },
          applications: {
            where: {
              status: {
                in: [
                  ApplicationStatus.SUBMITTED,
                  ApplicationStatus.UNDER_REVIEW,
                  ApplicationStatus.SHORTLISTED,
                ],
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return clubs.map((club) => ({
    ...club,
    myRole:
      club.memberships[0]?.role ??
      (globalRole === GlobalRole.SUPER_ADMIN ? ClubRole.PRESIDENT : ClubRole.MEMBER),
    memberCount: club._count.memberships,
    activeTasksCount: club._count.tasks,
    upcomingEventsCount: club._count.events,
    pendingApplicationsCount: club._count.applications,
    memberships: undefined,
    _count: undefined,
  }));
}

export async function getAuthorizedClub(
  clubId: string,
  userId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(userId, globalRole, clubId, LEADER_ROLES);

  const club = await prisma.club.findFirst({
    where: { id: clubId, isActive: true },
    include: {
      memberships: {
        where: { status: MembershipStatus.ACTIVE, role: { in: LEADER_ROLES } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
              department: true,
              yearOfStudy: true,
            },
          },
        },
      },
      _count: {
        select: {
          memberships: { where: { status: MembershipStatus.ACTIVE } },
          tasks: { where: { status: { not: TaskStatus.COMPLETED } } },
          events: { where: { status: EventStatus.UPCOMING } },
        },
      },
    },
  });

  if (!club) throw new AppError('Club not found', 404);

  return {
    ...club,
    memberCount: club._count.memberships,
    activeTasksCount: club._count.tasks,
    upcomingEventsCount: club._count.events,
    leadership: club.memberships,
    memberships: undefined,
    _count: undefined,
  };
}

export async function getPresidentDashboard(
  userId: string,
  globalRole: GlobalRole,
  requestedClubId?: string
) {
  const authorizedClubs = await listAuthorizedClubs(userId, globalRole);
  if (authorizedClubs.length === 0) {
    throw new AppError('You do not have leadership permissions for any club', 403);
  }

  const targetClubId = requestedClubId || authorizedClubs[0].id;
  await assertClubRole(userId, globalRole, targetClubId, LEADER_ROLES);

  const club = authorizedClubs.find((c) => c.id === targetClubId) || authorizedClubs[0];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const next72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const [
    activeMemberships,
    pendingRequestsCount,
    tasks,
    contributions,
    applications,
    events,
    recentTaskActivities,
  ] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { clubId: targetClubId, status: MembershipStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            yearOfStudy: true,
            profileImage: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.clubMembership.count({
      where: { clubId: targetClubId, status: MembershipStatus.PENDING },
    }),
    prisma.task.findMany({
      where: { clubId: targetClubId },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.contribution.findMany({
      where: { clubId: targetClubId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.recruitmentApplication.findMany({
      where: { clubId: targetClubId },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { appliedAt: 'desc' },
    }),
    prisma.event.findMany({
      where: { clubId: targetClubId },
      include: {
        _count: {
          select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } },
        },
      },
      orderBy: { startDate: 'asc' },
    }),
    prisma.taskActivity.findMany({
      where: { task: { clubId: targetClubId } },
      include: {
        user: { select: { id: true, fullName: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < now);
  const nearingDeadlineTasks = activeTasks.filter(
    (t) => t.dueDate && t.dueDate >= now && t.dueDate <= next72Hours
  );
  const unassignedTasks = activeTasks.filter((t) => !t.assignedToId);

  const pendingContributions = contributions.filter((c) => c.status === ContributionStatus.PENDING);
  const verifiedContributions = contributions.filter(
    (c) => c.status === ContributionStatus.VERIFIED
  );
  const totalVerifiedHours = Number(
    verifiedContributions.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1)
  );
  const totalVerifiedPoints = verifiedContributions.reduce((acc, c) => acc + c.points, 0);

  const upcomingEvents = events.filter(
    (e) =>
      e.startDate >= now &&
      (e.status === EventStatus.UPCOMING || e.status === EventStatus.ONGOING)
  );

  const pendingStatuses: ApplicationStatus[] = [
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
  ];
  const pendingApplications = applications.filter((a) => pendingStatuses.includes(a.status));

  // Member engagement & workload per member
  const memberMetrics = activeMemberships.map((m) => {
    const memberActiveTasks = activeTasks.filter((t) => t.assignedToId === m.userId).length;
    const memberCompletedTasks = completedTasks.filter((t) => t.assignedToId === m.userId).length;
    const memberVerifiedContribs = verifiedContributions.filter((c) => c.userId === m.userId);
    const points = memberVerifiedContribs.reduce((acc, c) => acc + c.points, 0);
    const hours = Number(
      memberVerifiedContribs.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1)
    );
    const recentActivityCount =
      tasks.filter((t) => t.assignedToId === m.userId && t.updatedAt >= thirtyDaysAgo).length +
      contributions.filter((c) => c.userId === m.userId && c.createdAt >= thirtyDaysAgo).length;

    return {
      userId: m.userId,
      fullName: m.user.fullName,
      role: m.role,
      activeTasks: memberActiveTasks,
      completedTasks: memberCompletedTasks,
      verifiedContributions: memberVerifiedContribs.length,
      points,
      hours,
      isRecentlyActive: recentActivityCount > 0,
    };
  });

  const activeRecentCount = memberMetrics.filter((m) => m.isRecentlyActive).length;
  const engagementPercentage =
    memberMetrics.length === 0
      ? 0
      : Math.round((activeRecentCount / memberMetrics.length) * 100);

  // Suggested assignee = active member with lowest active tasks count
  const sortedByLightestLoad = [...memberMetrics].sort((a, b) => a.activeTasks - b.activeTasks);

  // Combine real recent activity feed
  const recentActivityFeed = [
    ...activeMemberships.slice(-5).map((m) => ({
      id: `mem-${m.id}`,
      kind: 'MEMBER_JOINED',
      title: `${m.user.fullName} joined as ${m.role}`,
      timestamp: m.joinedAt,
    })),
    ...recentTaskActivities.map((a) => ({
      id: `ta-${a.id}`,
      kind: `TASK_${a.action}`,
      title: `${a.user.fullName} ${a.action.toLowerCase().replace('_', ' ')}: "${a.task.title}"`,
      timestamp: a.createdAt,
    })),
    ...contributions.slice(0, 5).map((c) => ({
      id: `con-${c.id}`,
      kind: `CONTRIBUTION_${c.status}`,
      title: `${c.user.fullName} contribution "${c.title}" (${c.status})`,
      timestamp: c.updatedAt,
    })),
    ...applications.slice(0, 5).map((a) => ({
      id: `app-${a.id}`,
      kind: 'APPLICATION_RECEIVED',
      title: `${a.user.fullName} applied for ${a.preferredRole} (${a.status})`,
      timestamp: a.appliedAt,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  return {
    club,
    authorizedClubs,
    overview: {
      totalMembers: activeMemberships.length,
      pendingRequests: pendingRequestsCount,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      pendingContributions: pendingContributions.length,
      recruitmentApplications: pendingApplications.length,
      upcomingEvents: upcomingEvents.length,
    },
    memberEngagement: {
      activeMembersCount: activeRecentCount,
      inactiveMembers: memberMetrics.filter((m) => !m.isRecentlyActive),
      mostActiveMembers: [...memberMetrics]
        .sort((a, b) => b.points + b.completedTasks * 10 - (a.points + a.completedTasks * 10))
        .slice(0, 5),
      engagementPercentage,
    },
    taskOverview: {
      byStatus: {
        TODO: tasks.filter((t) => t.status === TaskStatus.TODO).length,
        IN_PROGRESS: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
        UNDER_REVIEW: tasks.filter((t) => t.status === TaskStatus.UNDER_REVIEW).length,
        COMPLETED: completedTasks.length,
      },
      nearingDeadline: nearingDeadlineTasks.slice(0, 5),
      overdue: overdueTasks.slice(0, 5),
      recentlyCompleted: completedTasks.slice(0, 5),
    },
    workloadDistribution: {
      members: memberMetrics,
      overloadedMembers: memberMetrics.filter((m) => m.activeTasks >= 3),
      lightLoadMembers: memberMetrics.filter((m) => m.activeTasks <= 1),
      unassignedTasksCount: unassignedTasks.length,
      suggestedAssignee: sortedByLightestLoad[0] ?? null,
    },
    contributionOverview: {
      totalVerified: verifiedContributions.length,
      totalVerifiedHours,
      totalVerifiedPoints,
      pendingVerifications: pendingContributions.length,
      topContributors: [...memberMetrics]
        .filter((m) => m.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5),
    },
    recruitmentOverview: {
      total: applications.length,
      SUBMITTED: applications.filter((a) => a.status === ApplicationStatus.SUBMITTED).length,
      UNDER_REVIEW: applications.filter((a) => a.status === ApplicationStatus.UNDER_REVIEW).length,
      SHORTLISTED: applications.filter((a) => a.status === ApplicationStatus.SHORTLISTED).length,
      ACCEPTED: applications.filter((a) => a.status === ApplicationStatus.ACCEPTED).length,
      REJECTED: applications.filter((a) => a.status === ApplicationStatus.REJECTED).length,
    },
    upcomingEvents: upcomingEvents.map((e) => ({
      ...e,
      registeredCount: e._count.registrations,
      _count: undefined,
    })),
    recentActivityFeed,
  };
}

export async function listClubMembersDetailed(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole,
  query: { search?: string; role?: string; status?: string; sort?: string }
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const memberships = await prisma.clubMembership.findMany({
    where: {
      clubId,
      ...(query.status && query.status !== 'ALL'
        ? { status: query.status as MembershipStatus }
        : { status: { in: [MembershipStatus.ACTIVE, MembershipStatus.LEFT, MembershipStatus.REMOVED] } }),
      ...(query.role && query.role !== 'ALL' ? { role: query.role as ClubRole } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          course: true,
          yearOfStudy: true,
          profileImage: true,
          bio: true,
          skills: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  const [tasks, contributions, taskActivities] = await Promise.all([
    prisma.task.findMany({
      where: { clubId },
      select: { assignedToId: true, status: true, updatedAt: true },
    }),
    prisma.contribution.findMany({
      where: { clubId, status: ContributionStatus.VERIFIED },
      select: { userId: true, points: true, hoursSpent: true, createdAt: true },
    }),
    prisma.taskActivity.findMany({
      where: { task: { clubId } },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  let enriched = memberships.map((m) => {
    const assignedTasks = tasks.filter(
      (t) => t.assignedToId === m.userId && t.status !== TaskStatus.COMPLETED
    ).length;
    const completedTasks = tasks.filter(
      (t) => t.assignedToId === m.userId && t.status === TaskStatus.COMPLETED
    ).length;
    const verified = contributions.filter((c) => c.userId === m.userId);
    const totalPoints = verified.reduce((acc, c) => acc + c.points, 0);
    const totalHours = Number(verified.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1));
    const lastTaskAct = taskActivities.find((a) => a.userId === m.userId)?.createdAt;
    const lastContrib = verified[0]?.createdAt;
    const lastActivity =
      lastTaskAct && lastContrib
        ? lastTaskAct > lastContrib
          ? lastTaskAct
          : lastContrib
        : lastTaskAct || lastContrib || m.joinedAt;

    return {
      ...m,
      assignedTasks,
      completedTasks,
      verifiedContributions: verified.length,
      totalPoints,
      totalHours,
      lastActivity,
    };
  });

  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    enriched = enriched.filter(
      (m) =>
        m.user.fullName.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q) ||
        (m.user.department || '').toLowerCase().includes(q)
    );
  }

  if (query.sort === 'points') {
    enriched.sort((a, b) => b.totalPoints - a.totalPoints);
  } else if (query.sort === 'completedTasks') {
    enriched.sort((a, b) => b.completedTasks - a.completedTasks);
  }

  return enriched;
}

export async function getClubMemberDetail(
  clubId: string,
  memberId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const membership = await prisma.clubMembership.findFirst({
    where: { clubId, OR: [{ id: memberId }, { userId: memberId }] },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          course: true,
          yearOfStudy: true,
          bio: true,
          skills: true,
          interests: true,
          profileImage: true,
        },
      },
    },
  });

  if (!membership) throw new AppError('Club member not found', 404);

  const [tasks, contributions, eventsAttended, recentActivities] = await Promise.all([
    prisma.task.findMany({
      where: { clubId, assignedToId: membership.userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contribution.findMany({
      where: { clubId, userId: membership.userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eventRegistration.findMany({
      where: {
        userId: membership.userId,
        event: { clubId },
        status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED] },
      },
      include: { event: { select: { id: true, title: true, startDate: true } } },
    }),
    prisma.taskActivity.findMany({
      where: { userId: membership.userId, task: { clubId } },
      include: { task: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const verifiedPoints = contributions
    .filter((c) => c.status === ContributionStatus.VERIFIED)
    .reduce((acc, c) => acc + c.points, 0);

  return {
    membership,
    assignedTasks: tasks.filter((t) => t.status !== TaskStatus.COMPLETED),
    completedTasks: tasks.filter((t) => t.status === TaskStatus.COMPLETED),
    contributions,
    verifiedPoints,
    eventsAttended,
    recentActivities,
  };
}

export async function updateClubMember(
  clubId: string,
  memberId: string,
  actorId: string,
  globalRole: GlobalRole,
  payload: { role?: ClubRole; status?: 'ACTIVE' | 'REMOVED' }
) {
  const actorMembership = await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const target = await prisma.clubMembership.findFirst({
    where: { clubId, OR: [{ id: memberId }, { userId: memberId }] },
    include: { club: { select: { name: true } } },
  });
  if (!target) throw new AppError('Member not found in this club', 404);

  if (
    target.userId === actorId &&
    payload.role &&
    payload.role !== target.role &&
    globalRole !== GlobalRole.SUPER_ADMIN
  ) {
    throw new AppError('You cannot elevate or change your own club leadership role', 403);
  }

  if (
    payload.role === ClubRole.PRESIDENT &&
    globalRole !== GlobalRole.SUPER_ADMIN &&
    actorMembership?.role !== ClubRole.PRESIDENT
  ) {
    throw new AppError('Only a current club President can assign the President role', 403);
  }

  if (
    target.role === ClubRole.PRESIDENT &&
    (payload.status === MembershipStatus.REMOVED ||
      (payload.role && payload.role !== ClubRole.PRESIDENT))
  ) {
    const otherPresidents = await prisma.clubMembership.count({
      where: {
        clubId,
        status: MembershipStatus.ACTIVE,
        role: ClubRole.PRESIDENT,
        id: { not: target.id },
      },
    });
    if (otherPresidents === 0) {
      throw new AppError('Assign another President before changing or removing the sole President', 400);
    }
  }

  const updated = await prisma.clubMembership.update({
    where: { id: target.id },
    data: {
      ...(payload.role ? { role: payload.role } : {}),
      ...(payload.status ? { status: payload.status } : {}),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (payload.status === MembershipStatus.REMOVED) {
    await createNotification({
      userId: target.userId,
      title: `Removed from ${target.club.name}`,
      message: `Your membership in ${target.club.name} was ended by club leadership.`,
      type: 'APPLICATION_DECISION',
      relatedEntityId: clubId,
      relatedEntityType: 'Club',
    });
  } else if (payload.role && payload.role !== target.role) {
    await createNotification({
      userId: target.userId,
      title: `Role updated in ${target.club.name}`,
      message: `Your club role is now ${payload.role}.`,
      type: 'ANNOUNCEMENT',
      relatedEntityId: clubId,
      relatedEntityType: 'Club',
    });
  }

  return updated;
}

export async function getPresidentTasksWithWorkload(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const [tasks, activeMembers] = await Promise.all([
    prisma.task.findMany({
      where: { clubId },
      include: {
        club: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, fullName: true, profileImage: true } },
        createdBy: { select: { id: true, fullName: true } },
        activities: {
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.clubMembership.findMany({
      where: { clubId, status: MembershipStatus.ACTIVE },
      include: {
        user: { select: { id: true, fullName: true, department: true, yearOfStudy: true } },
      },
    }),
  ]);

  const membersWorkload = activeMembers
    .map((m) => {
      const activeCount = tasks.filter(
        (t) => t.assignedToId === m.userId && t.status !== TaskStatus.COMPLETED
      ).length;
      return {
        userId: m.userId,
        fullName: m.user.fullName,
        role: m.role,
        activeTasksCount: activeCount,
        isHighLoad: activeCount >= 3,
      };
    })
    .sort((a, b) => a.activeTasksCount - b.activeTasksCount);

  return {
    tasks,
    membersWorkload,
    suggestedAssignee: membersWorkload[0] ?? null,
  };
}

export async function listClubEventsForPresident(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const events = await prisma.event.findMany({
    where: { clubId },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      _count: {
        select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  return events.map((e) => ({
    ...e,
    registeredCount: e._count.registrations,
    _count: undefined,
  }));
}

export async function getPresidentAnalytics(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole,
  query: { range?: string; from?: string; to?: string }
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const now = new Date();
  let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let endDate = now;

  if (query.range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (query.range === '90d') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (query.range === '180d') {
    startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  } else if (query.range === 'custom' && query.from) {
    startDate = new Date(query.from);
    if (query.to) endDate = new Date(query.to);
  }

  const [memberships, tasks, contributions, applications] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { clubId, status: MembershipStatus.ACTIVE },
      include: { user: { select: { id: true, fullName: true } } },
    }),
    prisma.task.findMany({
      where: { clubId, createdAt: { gte: startDate, lte: endDate } },
      include: { assignedTo: { select: { id: true, fullName: true } } },
    }),
    prisma.contribution.findMany({
      where: { clubId, createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.recruitmentApplication.findMany({
      where: { clubId, appliedAt: { gte: startDate, lte: endDate } },
    }),
  ]);

  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const pendingTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < now);
  const unassignedTasks = pendingTasks.filter((t) => !t.assignedToId);

  const completionDurationsHours = completedTasks
    .filter((t) => t.completedAt)
    .map((t) => (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));

  const avgCompletionHours =
    completionDurationsHours.length === 0
      ? 0
      : Number(
          (
            completionDurationsHours.reduce((a, b) => a + b, 0) /
            completionDurationsHours.length
          ).toFixed(1)
        );

  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  const verifiedContribs = contributions.filter((c) => c.status === ContributionStatus.VERIFIED);
  const pendingContribs = contributions.filter((c) => c.status === ContributionStatus.PENDING);

  const contributionsByType = (Object.keys(DEFAULT_CONTRIBUTION_POINTS) as ContributionType[]).map(
    (type) => {
      const matching = verifiedContribs.filter((c) => c.contributionType === type);
      return {
        type,
        count: matching.length,
        points: matching.reduce((acc, c) => acc + c.points, 0),
        hours: Number(matching.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1)),
      };
    }
  );

  const memberWorkload = memberships.map((m) => ({
    name: m.user.fullName.split(' ')[0],
    fullName: m.user.fullName,
    activeTasks: pendingTasks.filter((t) => t.assignedToId === m.userId).length,
    completedTasks: completedTasks.filter((t) => t.assignedToId === m.userId).length,
  }));

  const activeUsersInRange = new Set([
    ...tasks.map((t) => t.assignedToId).filter(Boolean),
    ...contributions.map((c) => c.userId),
  ]);

  const newMembersInRange = memberships.filter(
    (m) => m.joinedAt >= startDate && m.joinedAt <= endDate
  ).length;

  const acceptedApps = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED).length;
  const rejectedApps = applications.filter((a) => a.status === ApplicationStatus.REJECTED).length;

  return {
    dateRange: { startDate, endDate },
    engagement: {
      totalMembers: memberships.length,
      activeMembersCount: activeUsersInRange.size,
      inactiveMembersCount: Math.max(0, memberships.length - activeUsersInRange.size),
      activePercentage:
        memberships.length === 0
          ? 0
          : Math.round((activeUsersInRange.size / memberships.length) * 100),
      newMembersInRange,
    },
    tasks: {
      total: tasks.length,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      unassigned: unassignedTasks.length,
      avgCompletionHours,
      completionRate,
    },
    contributions: {
      verifiedCount: verifiedContribs.length,
      pendingCount: pendingContribs.length,
      totalHours: Number(
        verifiedContribs.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1)
      ),
      totalPoints: verifiedContribs.reduce((acc, c) => acc + c.points, 0),
      byType: contributionsByType,
    },
    workload: memberWorkload,
    recruitment: {
      total: applications.length,
      accepted: acceptedApps,
      rejected: rejectedApps,
      acceptanceRate:
        applications.length === 0 ? 0 : Math.round((acceptedApps / applications.length) * 100),
      rejectionRate:
        applications.length === 0 ? 0 : Math.round((rejectedApps / applications.length) * 100),
    },
  };
}

export async function updateClubSettings(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole,
  input: {
    name?: string;
    description?: string;
    shortDescription?: string;
    mission?: string | null;
    category?: string;
    logo?: string | null;
    coverImage?: string | null;
    accentColor?: string;
    meetingSchedule?: string | null;
    expectedTimeCommitment?: string | null;
    location?: string | null;
    requirements?: string[];
    skills?: string[];
    isRecruiting?: boolean;
    requireVerification?: boolean;
    contributionPointsConfig?: Record<string, number>;
    transferPresidentToUserId?: string;
    archiveClub?: boolean;
  }
) {
  const actorMembership = await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  if (input.transferPresidentToUserId) {
    if (
      globalRole !== GlobalRole.SUPER_ADMIN &&
      actorMembership?.role !== ClubRole.PRESIDENT
    ) {
      throw new AppError('Only the current club President can transfer presidency', 403);
    }

    const recipient = await prisma.clubMembership.findUnique({
      where: {
        userId_clubId: { userId: input.transferPresidentToUserId, clubId },
      },
    });
    if (!recipient || recipient.status !== MembershipStatus.ACTIVE) {
      throw new AppError('Transfer recipient must be an active member of this club', 400);
    }

    await prisma.$transaction([
      prisma.clubMembership.update({
        where: { id: recipient.id },
        data: { role: ClubRole.PRESIDENT },
      }),
      ...(actorMembership && actorMembership.userId !== input.transferPresidentToUserId
        ? [
            prisma.clubMembership.update({
              where: { id: actorMembership.id },
              data: { role: ClubRole.VICE_PRESIDENT },
            }),
          ]
        : []),
    ]);
  }

  if (input.archiveClub) {
    if (
      globalRole !== GlobalRole.SUPER_ADMIN &&
      actorMembership?.role !== ClubRole.PRESIDENT
    ) {
      throw new AppError('Only the club President can archive the club', 403);
    }
  }

  const { transferPresidentToUserId: _t, archiveClub, ...clubPatch } = input;

  return prisma.club.update({
    where: { id: clubId },
    data: {
      ...clubPatch,
      ...(archiveClub ? { isActive: false } : {}),
    },
  });
}
