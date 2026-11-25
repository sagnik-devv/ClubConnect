import { NextFunction, Request, Response } from 'express';
import * as notificationService from '../services/notification.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = req.query.filter as 'all' | 'unread' | 'read' | undefined;
    const items = await notificationService.listUserNotifications(req.user!.id, filter);
    return sendSuccess(res, items, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadNotificationCount(req.user!.id);
    return sendSuccess(res, { unreadCount: count }, 'Unread count retrieved');
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const isRead = typeof req.body?.isRead === 'boolean' ? req.body.isRead : true;
    const updated = await notificationService.markNotificationRead(
      getParam(req, 'id'),
      req.user!.id,
      isRead
    );
    return sendSuccess(res, updated, 'Notification updated');
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllNotificationsRead(req.user!.id);
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

export async function removeNotification(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.deleteNotification(getParam(req, 'id'), req.user!.id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
