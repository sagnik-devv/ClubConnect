import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { emitToUser } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      relatedEntityId: input.relatedEntityId,
      relatedEntityType: input.relatedEntityType,
    },
  });

  emitToUser(input.userId, 'notification:new', notification);
  return notification;
}

export async function createManyNotifications(items: CreateNotificationInput[]) {
  if (items.length === 0) return [];
  const created = await Promise.all(items.map((item) => createNotification(item)));
  return created;
}

export async function listUserNotifications(userId: string, filter?: 'all' | 'unread' | 'read') {
  const where =
    filter === 'unread'
      ? { userId, isRead: false }
      : filter === 'read'
      ? { userId, isRead: true }
      : { userId };

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(id: string, userId: string, isRead = true) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new AppError('Notification not found', 404);
  if (existing.userId !== userId) throw new AppError('Access denied to notification', 403);

  return prisma.notification.update({
    where: { id },
    data: { isRead },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotification(id: string, userId: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new AppError('Notification not found', 404);
  if (existing.userId !== userId) throw new AppError('Access denied to notification', 403);

  await prisma.notification.delete({ where: { id } });
}
