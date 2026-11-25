import { api } from './api';
import { ApiResponse, NotificationItem } from '../types';

export const notificationService = {
  async list(filter?: 'all' | 'unread' | 'read') {
    const res = await api.get<ApiResponse<NotificationItem[]>>('/notifications', {
      params: filter ? { filter } : undefined,
    });
    return res.data.data;
  },

  async getUnreadCount() {
    const res = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data.unreadCount;
  },

  async markRead(id: string, isRead = true) {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`, {
      isRead,
    });
    return res.data.data;
  },

  async markAllRead() {
    await api.patch('/notifications/read-all');
  },

  async remove(id: string) {
    await api.delete(`/notifications/${id}`);
  },
};
