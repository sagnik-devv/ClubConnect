import {
  ApplicationStatus,
  ClubRole,
  GlobalRole,
  MembershipStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { assertClubRole, LEADER_ROLES } from '../middleware/role.middleware.js';
import { createManyNotifications, createNotification } from './notification.service.js';

export async function listRecruitmentOverview(userId: string, globalRole: GlobalRole) {
  const myApplications = await prisma.recruitmentApplication.findMany({
    where: { userId },
    include: {
      club: { select: { id: true, name: true, slug: true, category: true, expectedTimeCommitment: true } },
    },
    orderBy: { appliedAt: 'desc' },
  });

  let manageableApplications: Awaited<ReturnType<typeof listClubApplications>> = [];
  if (globalRole === GlobalRole.SUPER_ADMIN) {
    manageableApplications = await prisma.recruitmentApplication.findMany({
      include: {
        club: { select: { id: true, name: true, slug: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            course: true,
            yearOfStudy: true,
            profileImage: true,
          },
        },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
  } else {
    const leaderClubs = await prisma.clubMembership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE, role: { in: LEADER_ROLES } },
      select: { clubId: true },
    });
    if (leaderClubs.length > 0) {
      manageableApplications = await prisma.recruitmentApplication.findMany({
        where: { clubId: { in: leaderClubs.map((c) => c.clubId) } },
        include: {
          club: { select: { id: true, name: true, slug: true } },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
              course: true,
              yearOfStudy: true,
              profileImage: true,
            },
          },
          reviewedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { appliedAt: 'desc' },
      });
    }
  }

  return { myApplications, manageableApplications };
}

export async function listClubApplications(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  return prisma.recruitmentApplication.findMany({
    where: { clubId },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          course: true,
          yearOfStudy: true,
          profileImage: true,
        },
      },
      reviewedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { appliedAt: 'desc' },
  });
}

export async function listMyApplications(userId: string) {
  return prisma.recruitmentApplication.findMany({
    where: { userId },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          expectedTimeCommitment: true,
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });
}

export async function getApplicationById(
  id: string,
  actorId: string,
  globalRole: GlobalRole
) {
  const application = await prisma.recruitmentApplication.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          course: true,
          yearOfStudy: true,
        },
      },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  });

  if (!application) throw new AppError('Application not found', 404);

  if (application.userId !== actorId && globalRole !== GlobalRole.SUPER_ADMIN) {
    await assertClubRole(actorId, globalRole, application.clubId, LEADER_ROLES);
  }

  return application;
}

export async function submitApplication(
  clubId: string,
  userId: string,
  input: {
    motivation: string;
    skills: string[];
    experience?: string;
    preferredRole: string;
  }
) {
  const club = await prisma.club.findFirst({ where: { id: clubId, isActive: true } });
  if (!club) throw new AppError('Club not found', 404);
  if (!club.isRecruiting) {
    throw new AppError('This club is not currently accepting applications', 400);
  }

  const activeMembership = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId, clubId } },
  });
  if (activeMembership?.status === MembershipStatus.ACTIVE) {
    throw new AppError('You are already an active member of this club', 409);
  }

  const pendingApp = await prisma.recruitmentApplication.findFirst({
    where: {
      userId,
      clubId,
      status: {
        in: [
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.SHORTLISTED,
        ],
      },
    },
  });
  if (pendingApp) {
    throw new AppError('You already have a pending application for this club', 409);
  }

  const application = await prisma.recruitmentApplication.create({
    data: {
      userId,
      clubId,
      motivation: input.motivation,
      skills: input.skills,
      experience: input.experience,
      preferredRole: input.preferredRole,
      status: ApplicationStatus.SUBMITTED,
      onboardingStep: 1,
    },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, fullName: true } },
    },
  });

  await createNotification({
    userId,
    title: `Application submitted to ${club.name}`,
    message: `Your application for ${input.preferredRole} was received.`,
    type: 'APPLICATION_SUBMITTED',
    relatedEntityId: application.id,
    relatedEntityType: 'RecruitmentApplication',
  });

  const leaders = await prisma.clubMembership.findMany({
    where: { clubId, status: MembershipStatus.ACTIVE, role: { in: LEADER_ROLES } },
  });
  await createManyNotifications(
    leaders.map((l) => ({
      userId: l.userId,
      title: `New application in ${club.name}`,
      message: `${application.user.fullName} applied for ${input.preferredRole}.`,
      type: 'APPLICATION_SUBMITTED',
      relatedEntityId: application.id,
      relatedEntityType: 'RecruitmentApplication',
    }))
  );

  return application;
}

export async function updateApplicationStatus(
  id: string,
  reviewerId: string,
  globalRole: GlobalRole,
  payload: { status: ApplicationStatus; onboardingStep?: number }
) {
  const existing = await prisma.recruitmentApplication.findUnique({
    where: { id },
    include: { club: { select: { id: true, name: true } } },
  });
  if (!existing) throw new AppError('Application not found', 404);

  if (existing.userId === reviewerId) {
    throw new AppError('You cannot review or approve your own recruitment application', 403);
  }

  await assertClubRole(reviewerId, globalRole, existing.clubId, LEADER_ROLES);

  const updated = await prisma.$transaction(async (tx) => {
    const nextStep =
      payload.onboardingStep ??
      (payload.status === ApplicationStatus.ACCEPTED
        ? Math.max(existing.onboardingStep, 2)
        : existing.onboardingStep);

    const app = await tx.recruitmentApplication.update({
      where: { id },
      data: {
        status: payload.status,
        reviewedById: reviewerId,
        onboardingStep: nextStep,
      },
      include: {
        club: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });

    if (payload.status === ApplicationStatus.ACCEPTED) {
      const existingMembership = await tx.clubMembership.findUnique({
        where: { userId_clubId: { userId: existing.userId, clubId: existing.clubId } },
      });

      if (!existingMembership) {
        await tx.clubMembership.create({
          data: {
            userId: existing.userId,
            clubId: existing.clubId,
            role: ClubRole.MEMBER,
            status: MembershipStatus.ACTIVE,
          },
        });
      } else if (existingMembership.status !== MembershipStatus.ACTIVE) {
        await tx.clubMembership.update({
          where: { id: existingMembership.id },
          data: { status: MembershipStatus.ACTIVE, role: ClubRole.MEMBER },
        });
      }
    }

    return app;
  });

  await createNotification({
    userId: existing.userId,
    title: `Application ${payload.status.toLowerCase()} — ${existing.club.name}`,
    message:
      payload.status === ApplicationStatus.ACCEPTED
        ? `Congratulations! You were accepted into ${existing.club.name}.`
        : `Your application status in ${existing.club.name} changed to ${payload.status}.`,
    type: 'APPLICATION_DECISION',
    relatedEntityId: updated.id,
    relatedEntityType: 'RecruitmentApplication',
  });

  return updated;
}

export async function updateApplicationNotes(
  id: string,
  reviewerId: string,
  globalRole: GlobalRole,
  reviewNotes: string
) {
  const existing = await prisma.recruitmentApplication.findUnique({ where: { id } });
  if (!existing) throw new AppError('Application not found', 404);
  if (existing.userId === reviewerId) {
    throw new AppError('You cannot add review notes to your own application', 403);
  }
  await assertClubRole(reviewerId, globalRole, existing.clubId, LEADER_ROLES);

  return prisma.recruitmentApplication.update({
    where: { id },
    data: { reviewNotes, reviewedById: reviewerId },
  });
}

export async function updateOnboardingStep(
  id: string,
  actorId: string,
  globalRole: GlobalRole,
  step: number
) {
  const existing = await prisma.recruitmentApplication.findUnique({ where: { id } });
  if (!existing) throw new AppError('Application not found', 404);

  if (existing.userId !== actorId && globalRole !== GlobalRole.SUPER_ADMIN) {
    await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);
  }

  return prisma.recruitmentApplication.update({
    where: { id },
    data: { onboardingStep: step },
  });
}
