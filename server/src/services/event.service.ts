import { EventStatus, GlobalRole, MembershipStatus, Prisma, RegistrationStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { assertClubRole, LEADER_ROLES } from '../middleware/role.middleware.js';
import { createManyNotifications, createNotification } from './notification.service.js';

export async function listEvents(
  query: { clubId?: string; status?: EventStatus; upcoming?: string },
  currentUserId?: string
) {
  const where: Prisma.EventWhereInput = {};
  if (query.clubId) where.clubId = query.clubId;
  if (query.status) where.status = query.status;
  if (query.upcoming === 'true') {
    where.startDate = { gte: new Date() };
    where.status = { in: [EventStatus.UPCOMING, EventStatus.ONGOING] };
  } else if (query.upcoming === 'false') {
    where.OR = [{ startDate: { lt: new Date() } }, { status: EventStatus.COMPLETED }];
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: 'asc' },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      _count: {
        select: {
          registrations: { where: { status: RegistrationStatus.REGISTERED } },
        },
      },
      registrations: currentUserId
        ? {
            where: { userId: currentUserId, status: RegistrationStatus.REGISTERED },
            select: { id: true, status: true },
          }
        : false,
    },
  });

  return events.map((ev) => ({
    ...ev,
    registeredCount: ev._count.registrations,
    isRegistered: Array.isArray(ev.registrations) ? ev.registrations.length > 0 : false,
    registrations: undefined,
    _count: undefined,
  }));
}

export async function getEventById(id: string, currentUserId?: string) {
  const ev = await prisma.event.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, fullName: true } },
      _count: {
        select: {
          registrations: { where: { status: RegistrationStatus.REGISTERED } },
        },
      },
      registrations: currentUserId
        ? {
            where: { userId: currentUserId, status: RegistrationStatus.REGISTERED },
            select: { id: true, status: true },
          }
        : false,
    },
  });

  if (!ev) throw new AppError('Event not found', 404);

  return {
    ...ev,
    registeredCount: ev._count.registrations,
    isRegistered: Array.isArray(ev.registrations) ? ev.registrations.length > 0 : false,
    registrations: undefined,
    _count: undefined,
  };
}

export async function createEvent(
  actorId: string,
  globalRole: GlobalRole,
  input: {
    clubId: string;
    title: string;
    description: string;
    location: string;
    category: string;
    startDate: string;
    endDate?: string | null;
    capacity: number;
    status: EventStatus;
  }
) {
  await assertClubRole(actorId, globalRole, input.clubId, LEADER_ROLES);

  const club = await prisma.club.findUniqueOrThrow({ where: { id: input.clubId } });

  const event = await prisma.event.create({
    data: {
      clubId: input.clubId,
      title: input.title,
      description: input.description,
      location: input.location,
      category: input.category,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      capacity: input.capacity,
      status: input.status,
      createdById: actorId,
    },
    include: {
      club: { select: { id: true, name: true, slug: true } },
    },
  });

  const activeMembers = await prisma.clubMembership.findMany({
    where: { clubId: input.clubId, status: MembershipStatus.ACTIVE, userId: { not: actorId } },
  });

  await createManyNotifications(
    activeMembers.map((m) => ({
      userId: m.userId,
      title: `New event in ${club.name}: ${event.title}`,
      message: `${event.location} · ${event.startDate.toDateString()}`,
      type: 'EVENT_CREATED',
      relatedEntityId: event.id,
      relatedEntityType: 'Event',
    }))
  );

  return { ...event, registeredCount: 0, isRegistered: false };
}

export async function updateEvent(
  id: string,
  actorId: string,
  globalRole: GlobalRole,
  patch: {
    title?: string;
    description?: string;
    location?: string;
    category?: string;
    startDate?: string;
    endDate?: string | null;
    capacity?: number;
    status?: EventStatus;
  }
) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError('Event not found', 404);
  await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);

  return prisma.event.update({
    where: { id },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.startDate !== undefined ? { startDate: new Date(patch.startDate) } : {}),
      ...(patch.endDate !== undefined
        ? { endDate: patch.endDate ? new Date(patch.endDate) : null }
        : {}),
      ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    },
  });
}

export async function deleteEvent(id: string, actorId: string, globalRole: GlobalRole) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError('Event not found', 404);
  await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);
  await prisma.event.delete({ where: { id } });
}

export async function registerForEvent(eventId: string, userId: string) {
  const registration = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      throw new AppError('Registration is closed for this event', 400);
    }

    const existingReg = await tx.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existingReg && existingReg.status === RegistrationStatus.REGISTERED) {
      throw new AppError('You are already registered for this event', 409);
    }

    const activeCount = await tx.eventRegistration.count({
      where: { eventId, status: RegistrationStatus.REGISTERED },
    });
    if (activeCount >= event.capacity) {
      throw new AppError('This event has reached full capacity', 409);
    }

    const reg = existingReg
      ? await tx.eventRegistration.update({
          where: { id: existingReg.id },
          data: { status: RegistrationStatus.REGISTERED, registeredAt: new Date() },
        })
      : await tx.eventRegistration.create({
          data: {
            eventId,
            userId,
            status: RegistrationStatus.REGISTERED,
          },
        });

    return { reg, event };
  });

  await createNotification({
    userId,
    title: `Event registration confirmed`,
    message: `You are registered for "${registration.event.title}".`,
    type: 'EVENT_REGISTERED',
    relatedEntityId: eventId,
    relatedEntityType: 'Event',
  });

  return registration.reg;
}

export async function cancelEventRegistration(eventId: string, userId: string) {
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!existing || existing.status !== RegistrationStatus.REGISTERED) {
    throw new AppError('You are not registered for this event', 404);
  }

  return prisma.eventRegistration.update({
    where: { id: existing.id },
    data: { status: RegistrationStatus.CANCELLED },
  });
}

export async function getEventAttendees(
  eventId: string,
  actorId: string,
  globalRole: GlobalRole
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  await assertClubRole(actorId, globalRole, event.clubId, LEADER_ROLES);

  return prisma.eventRegistration.findMany({
    where: { eventId, status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED] } },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          yearOfStudy: true,
        },
      },
    },
    orderBy: { registeredAt: 'asc' },
  });
}

export async function listMyEvents(userId: string) {
  return prisma.eventRegistration.findMany({
    where: { userId, status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED] } },
    include: {
      event: {
        include: {
          club: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { registeredAt: 'desc' },
  });
}
