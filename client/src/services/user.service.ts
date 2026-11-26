import { api } from './api';
import { ApiResponse, AuthUser, StudentAnalytics } from '../types';

export const userService = {
  async getMe() {
    const res = await api.get<ApiResponse<AuthUser>>('/users/me');
    return res.data.data;
  },

  async updateProfile(payload: {
    fullName?: string;
    bio?: string | null;
    department?: string | null;
    course?: string | null;
    yearOfStudy?: string | null;
    skills?: string[];
    interests?: string[];
    profileImage?: string | null;
  }) {
    const res = await api.patch<ApiResponse<AuthUser>>('/users/me', payload);
    return res.data.data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post<ApiResponse<AuthUser>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async getPlatformSummary() {
    const res = await api.get<
      ApiResponse<{
        clubsCount: number;
        activeMembershipsCount: number;
        upcomingEventsCount: number;
        verifiedContributionsCount: number;
      }>
    >('/analytics/platform');
    return res.data.data;
  },

  async getStudentAnalytics() {
    const res = await api.get<ApiResponse<StudentAnalytics>>('/analytics/student');
    return res.data.data;
  },
};
