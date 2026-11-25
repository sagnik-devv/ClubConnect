import { api } from './api';
import { ApiResponse, ClubEvent, EventStatus } from '../types';

export const eventService = {
  async listEvents(params?: { clubId?: string; status?: EventStatus; upcoming?: string }) {
    const res = await api.get<ApiResponse<ClubEvent[]>>('/events', { params });
    return res.data.data;
  },

  async createEvent(payload: {
    clubId: string;
    title: string;
    description: string;
    location: string;
    category: string;
    startDate: string;
    endDate?: string | null;
    capacity: number;
  }) {
    const res = await api.post<ApiResponse<ClubEvent>>('/events', payload);
    return res.data.data;
  },

  async updateEvent(id: string, payload: Partial<ClubEvent>) {
    const res = await api.patch<ApiResponse<ClubEvent>>(`/events/${id}`, payload);
    return res.data.data;
  },

  async deleteEvent(id: string) {
    await api.delete(`/events/${id}`);
  },

  async register(id: string) {
    const res = await api.post<ApiResponse<unknown>>(`/events/${id}/register`);
    return res.data.data;
  },

  async cancelRegistration(id: string) {
    const res = await api.delete<ApiResponse<unknown>>(`/events/${id}/register`);
    return res.data.data;
  },
};
