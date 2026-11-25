import {
  ApplicationStatus,
  ContributionStatus,
  GlobalRole,
  MembershipStatus,
  RegistrationStatus,
  TaskStatus,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { assertClubRole, LEADER_ROLES } from '../middleware/role.middleware.js';

export async function getPlatformSummary() {
  const [clubsCount, activeMembershipsCount, upcomingEventsCount, verifiedContributionsCount] =
    await Promise.all([
      prisma.club.count({ where: { isActive: true } }),
      prisma.clubMembership.count({ where: { status: MembershipStatus.ACTIVE } }),
      prisma.event.count({ where: { status: 'UPCOMING' } }),
      prisma.contribution.count({ where: { status: ContributionStatus.VERIFIED } }),
    ]);

  return {
    clubsCount,
    activeMembershipsCount,
    upcomingEventsCount,
    verifiedContributionsCount,
  };
}

export async function getStudentDashboardAnalytics(userId: string) {
  const [
    activeMemberships,
    pendingApplicationsCount,
    assignedTasks,
    verifiedContributionAgg,
    upcomingRegistrations,
    recentContributions,
    recentTaskActivities,
  ] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      include: {
        club: {
          include: {
            _count: { select: { memberships: { where: { status: MembershipStatus.ACTIVE } } } },
          },
        },
      },
    }),
    prisma.recruitmentApplication.count({
      where: {
        userId,
        status: {
          in: [
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.SHORTLISTED,
          ],
        },
      },
    }),
    prisma.task.findMany({
      where: { assignedToId: userId },
      include: { club: { select: { id: true, name: true, slug: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.contribution.aggregate({
      where: { userId, status: ContributionStatus.VERIFIED },
      _count: { id: true },
      _sum: { points: true, hoursSpent: true },
    }),
    prisma.eventRegistration.findMany({
      where: {
        userId,
        status: RegistrationStatus.REGISTERED,
        event: { startDate: { gte: new Date() } },
      },
      include: {
        event: {
          include: { club: { select: { id: true, name: true } } },
        },
      },
      orderBy: { event: { startDate: 'asc' } },
      take: 6,
    }),
    prisma.contribution.findMany({
      where: { userId },
      include: { club: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.taskActivity.findMany({
      where: { userId },
      include: {
        task: { select: { id: true, title: true, club: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  const completedTasksCount = assignedTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const pendingTasksCount = assignedTasks.filter((t) => t.status !== TaskStatus.COMPLETED).length;

  // Build real weekly activity across the last 5 weeks from DB records
  const now = new Date();
  const weeklyActivity = Array.from({ length: 5 }, (_, idx) => {
    const weeksAgo = 4 - idx;
    const end = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tasksCompleted = assignedTasks.filter(
      (t) =>
        t.status === TaskStatus.COMPLETED &&
        t.completedAt &&
        t.completedAt >= start &&
        t.completedAt < end
    ).length;

    const contributionsLogged = recentContributions.filter(
      (c) => c.createdAt >= start && c.createdAt < end
    ).length;

    return {
      week: `W${idx + 1}`,
      tasksCompleted,
      contributionsLogged,
    };
  });

  return {
    summary: {
      activeMemberships: activeMemberships.length,
      pendingApplications: pendingApplicationsCount,
      assignedTasks: assignedTasks.length,
      completedTasks: completedTasksCount,
      pendingTasks: pendingTasksCount,
      verifiedContributions: verifiedContributionAgg._count.id,
      totalVerifiedPoints: verifiedContributionAgg._sum.points ?? 0,
      totalVerifiedHours: Number((verifiedContributionAgg._sum.hoursSpent ?? 0).toFixed(1)),
      upcomingEventsCount: upcomingRegistrations.length,
    },
    clubs: activeMemberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      club: {
        ...m.club,
        memberCount: m.club._count.memberships,
        _count: undefined,
      },
    })),
    tasks: assignedTasks,
    upcomingEvents: upcomingRegistrations.map((r) => r.event),
    weeklyActivity,
    recentContributions,
    recentTaskActivities,
  };
}

export async function getClubManagementAnalytics(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  const now = new Date();

  const [
    activeMembers,
    pendingMembershipRequests,
    tasks,
    pendingContributionsCount,
    verifiedContributions,
    applicationsCount,
    upcomingEventsCount,
  ] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { clubId, status: MembershipStatus.ACTIVE },
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
      where: { clubId, status: MembershipStatus.PENDING },
    }),
    prisma.task.findMany({
      where: { clubId },
      select: {
        id: true,
        assignedToId: true,
        status: true,
        dueDate: true,
      },
    }),
    prisma.contribution.count({
      where: { clubId, status: ContributionStatus.PENDING },
    }),
    prisma.contribution.findMany({
      where: { clubId, status: ContributionStatus.VERIFIED },
      select: {
        userId: true,
        points: true,
        hoursSpent: true,
        createdAt: true,
      },
    }),
    prisma.recruitmentApplication.count({
      where: {
        clubId,
        status: {
          in: [
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.SHORTLISTED,
          ],
        },
      },
    }),
    prisma.event.count({
      where: { clubId, startDate: { gte: now }, status: 'UPCOMING' },
    }),
  ]);

  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < now);

  const memberRoster = activeMembers.map((m) => {
    const memberActiveTasks = activeTasks.filter((t) => t.assignedToId === m.userId).length;
    const memberCompletedTasks = completedTasks.filter((t) => t.assignedToId === m.userId).length;
    const memberContribs = verifiedContributions.filter((c) => c.userId === m.userId);
    const totalPoints = memberContribs.reduce((acc, c) => acc + c.points, 0);
    const totalHours = Number(memberContribs.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1));

    return {
      membershipId: m.id,
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
      assignedTasks: memberActiveTasks,
      completedTasks: memberCompletedTasks,
      verifiedContributions: memberContribs.length,
      totalPoints,
      totalHours,
    };
  });

  const participationRate =
    activeMembers.length === 0
      ? 0
      : Math.round(
          (memberRoster.filter(
            (m) => m.assignedTasks + m.completedTasks + m.verifiedContributions > 0
          ).length /
            activeMembers.length) *
            100
        );

  const workloadDistribution = memberRoster.map((m) => ({
    name: m.user.fullName.split(' ')[0],
    fullName: m.user.fullName,
    activeTasks: m.assignedTasks,
    completedTasks: m.completedTasks,
  }));

  const leaderboard = [...memberRoster]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);

  return {
    summary: {
      totalActiveMembers: activeMembers.length,
      pendingMembershipRequests,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      pendingContributions: pendingContributionsCount,
      pendingRecruitmentApplications: applicationsCount,
      upcomingEvents: upcomingEventsCount,
      participationRate,
    },
    memberRoster,
    workloadDistribution,
    leaderboard,
  };
}
