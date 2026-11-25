import { GlobalRole, MembershipStatus, Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import {
  assertActiveClubMember,
  assertClubRole,
  LEADER_ROLES,
} from '../middleware/role.middleware.js';
import { createNotification } from './notification.service.js';

export async function listTasks(
  userId: string,
  globalRole: GlobalRole,
  query: {
    clubId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: string;
    dueBefore?: string;
    sort?: 'dueDate' | 'createdAt';
  }
) {
  const where: Prisma.TaskWhereInput = {};

  if (globalRole !== GlobalRole.SUPER_ADMIN) {
    const activeMemberships = await prisma.clubMembership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      select: { clubId: true },
    });
    const allowedClubIds = activeMemberships.map((m) => m.clubId);
    if (query.clubId) {
      if (!allowedClubIds.includes(query.clubId)) {
        throw new AppError('You are not an active member of this club', 403);
      }
      where.clubId = query.clubId;
    } else {
      where.clubId = { in: allowedClubIds };
    }
  } else if (query.clubId) {
    where.clubId = query.clubId;
  }

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assignedToId) where.assignedToId = query.assignedToId;
  if (query.dueBefore) {
    where.dueDate = { lte: new Date(query.dueBefore) };
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput =
    query.sort === 'dueDate' ? { dueDate: 'asc' } : { createdAt: 'desc' };

  return prisma.task.findMany({
    where,
    orderBy,
    include: {
      club: { select: { id: true, name: true, slug: true } },
      assignedTo: { select: { id: true, fullName: true, profileImage: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });
}

export async function getTaskById(taskId: string, userId: string, globalRole: GlobalRole) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      assignedTo: { select: { id: true, fullName: true, profileImage: true } },
      createdBy: { select: { id: true, fullName: true } },
      activities: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) throw new AppError('Task not found', 404);
  await assertActiveClubMember(userId, globalRole, task.clubId);
  return task;
}

export async function createTask(
  actorId: string,
  globalRole: GlobalRole,
  input: {
    title: string;
    description: string;
    clubId: string;
    assignedToId?: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: string | null;
  }
) {
  await assertClubRole(actorId, globalRole, input.clubId, LEADER_ROLES);

  if (input.assignedToId) {
    const assigneeMembership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: input.assignedToId, clubId: input.clubId } },
    });
    if (!assigneeMembership || assigneeMembership.status !== MembershipStatus.ACTIVE) {
      throw new AppError('Assignee must be an active member of this club', 400);
    }
  }

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: input.title,
        description: input.description,
        clubId: input.clubId,
        createdById: actorId,
        assignedToId: input.assignedToId || null,
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        completedAt: input.status === TaskStatus.COMPLETED ? new Date() : null,
      },
      include: {
        club: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    await tx.taskActivity.create({
      data: {
        taskId: created.id,
        userId: actorId,
        action: 'CREATED',
        newValue: created.status,
      },
    });

    return created;
  });

  if (task.assignedToId && task.assignedToId !== actorId) {
    await createNotification({
      userId: task.assignedToId,
      title: `Task assigned in ${task.club.name}`,
      message: `You were assigned "${task.title}".`,
      type: 'TASK_ASSIGNED',
      relatedEntityId: task.id,
      relatedEntityType: 'Task',
    });
  }

  return task;
}

export async function updateTask(
  taskId: string,
  actorId: string,
  globalRole: GlobalRole,
  patch: {
    title?: string;
    description?: string;
    assignedToId?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string | null;
  }
) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: { club: { select: { id: true, name: true } } },
  });
  if (!existing) throw new AppError('Task not found', 404);

  await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);

  if (patch.assignedToId) {
    const assigneeMembership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: patch.assignedToId, clubId: existing.clubId } },
    });
    if (!assigneeMembership || assigneeMembership.status !== MembershipStatus.ACTIVE) {
      throw new AppError('Assignee must be an active member of this club', 400);
    }
  }

  const completedAt =
    patch.status === TaskStatus.COMPLETED
      ? existing.completedAt || new Date()
      : patch.status
      ? null
      : existing.completedAt;

  const updated = await prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.assignedToId !== undefined ? { assignedToId: patch.assignedToId } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.status !== undefined ? { status: patch.status, completedAt } : {}),
        ...(patch.dueDate !== undefined
          ? { dueDate: patch.dueDate ? new Date(patch.dueDate) : null }
          : {}),
      },
      include: {
        club: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    if (patch.status && patch.status !== existing.status) {
      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          action: 'STATUS_CHANGED',
          oldValue: existing.status,
          newValue: patch.status,
        },
      });
    }

    if (patch.priority && patch.priority !== existing.priority) {
      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          action: 'PRIORITY_CHANGED',
          oldValue: existing.priority,
          newValue: patch.priority,
        },
      });
    }

    if (patch.assignedToId !== undefined && patch.assignedToId !== existing.assignedToId) {
      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          action: 'REASSIGNED',
          oldValue: existing.assignedToId,
          newValue: patch.assignedToId,
        },
      });
    }

    return task;
  });

  if (
    patch.assignedToId &&
    patch.assignedToId !== existing.assignedToId &&
    patch.assignedToId !== actorId
  ) {
    await createNotification({
      userId: patch.assignedToId,
      title: `Task assigned in ${existing.club.name}`,
      message: `You were assigned "${updated.title}".`,
      type: 'TASK_ASSIGNED',
      relatedEntityId: updated.id,
      relatedEntityType: 'Task',
    });
  }

  return updated;
}

export async function updateTaskStatus(
  taskId: string,
  actorId: string,
  globalRole: GlobalRole,
  status: TaskStatus
) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: { club: { select: { id: true, name: true } } },
  });
  if (!existing) throw new AppError('Task not found', 404);

  let isLeader = globalRole === GlobalRole.SUPER_ADMIN;
  if (!isLeader) {
    const membership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: actorId, clubId: existing.clubId } },
    });
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new AppError('Active club membership required', 403);
    }
    isLeader = LEADER_ROLES.includes(membership.role);
  }

  if (!isLeader && existing.assignedToId !== actorId) {
    throw new AppError('You can only update status for tasks assigned to you', 403);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
      },
      include: {
        club: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    await tx.taskActivity.create({
      data: {
        taskId,
        userId: actorId,
        action: 'STATUS_CHANGED',
        oldValue: existing.status,
        newValue: status,
      },
    });

    return task;
  });

  if (existing.createdById !== actorId) {
    await createNotification({
      userId: existing.createdById,
      title: `Task updated in ${existing.club.name}`,
      message: `"${existing.title}" moved to ${status}.`,
      type: 'TASK_STATUS',
      relatedEntityId: taskId,
      relatedEntityType: 'Task',
    });
  }

  return updated;
}

export async function assignTask(
  taskId: string,
  actorId: string,
  globalRole: GlobalRole,
  assignedToId: string | null
) {
  return updateTask(taskId, actorId, globalRole, { assignedToId });
}

export async function deleteTask(taskId: string, actorId: string, globalRole: GlobalRole) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) throw new AppError('Task not found', 404);
  await assertClubRole(actorId, globalRole, existing.clubId, LEADER_ROLES);
  await prisma.task.delete({ where: { id: taskId } });
}

export async function getTaskActivity(taskId: string, actorId: string, globalRole: GlobalRole) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new AppError('Task not found', 404);
  await assertActiveClubMember(actorId, globalRole, task.clubId);

  return prisma.taskActivity.findMany({
    where: { taskId },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
