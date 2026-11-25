import { GlobalRole, MembershipStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { assertClubRole, LEADER_ROLES } from '../middleware/role.middleware.js';
import { createManyNotifications } from './notification.service.js';

export async function listMemberAnnouncements(userId: string) {
  const memberships = await prisma.clubMembership.findMany({
    where: { userId, status: MembershipStatus.ACTIVE },
    select: { clubId: true },
  });
  const clubIds = memberships.map((m) => m.clubId);
  if (clubIds.length === 0) return [];

  return prisma.announcement.findMany({
    where: { clubId: { in: clubIds } },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    take: 50,
  });
}

export async function listClubAnnouncements(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);

  return prisma.announcement.findMany({
    where: { clubId },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
  });
}

export async function createClubAnnouncement(
  clubId: string,
  actorId: string,
  globalRole: GlobalRole,
  input: { title: string; content: string; isPinned: boolean }
) {
  await assertClubRole(actorId, globalRole, clubId, LEADER_ROLES);
  const club = await prisma.club.findUniqueOrThrow({ where: { id: clubId } });

  const announcement = await prisma.announcement.create({
    data: {
      clubId,
      title: input.title,
      content: input.content,
      isPinned: input.isPinned,
      createdById: actorId,
    },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  const members = await prisma.clubMembership.findMany({
    where: { clubId, status: MembershipStatus.ACTIVE, userId: { not: actorId } },
  });

  await createManyNotifications(
    members.map((m) => ({
      userId: m.userId,
      title: `Announcement in ${club.name}: ${announcement.title}`,
      message: announcement.content.slice(0, 140),
      type: 'ANNOUNCEMENT',
      relatedEntityId: announcement.id,
      relatedEntityType: 'Announcement',
    }))
  );

  return announcement;
}

export async function updateAnnouncement(
  id: string,
  actorId: string,
  globalRole: GlobalRole,
  patch: { title?: string; content?: string; isPinned?: boolean }
) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError('Announcement not found', 404);
  await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);

  return prisma.announcement.update({
    where: { id },
    data: patch,
    include: {
      club: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });
}

export async function deleteAnnouncement(
  id: string,
  actorId: string,
  globalRole: GlobalRole
) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError('Announcement not found', 404);
  await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);
  await prisma.announcement.delete({ where: { id } });
}
