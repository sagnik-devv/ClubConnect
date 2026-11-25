import { api } from './api';
import {
  ApiResponse,
  ContributionItem,
  ContributionStatus,
  ContributionType,
} from '../types';

export const contributionService = {
  async list(params?: { clubId?: string; userId?: string; status?: ContributionStatus }) {
    const res = await api.get<ApiResponse<ContributionItem[]>>('/contributions', { params });
    return res.data.data;
  },

  async submit(payload: {
    clubId: string;
    taskId?: string | null;
    title: string;
    description: string;
    contributionType: ContributionType;
    hoursSpent: number;
  }) {
    const res = await api.post<ApiResponse<ContributionItem>>('/contributions', payload);
    return res.data.data;
  },

  async verify(
    id: string,
    payload: { status: 'VERIFIED' | 'REJECTED'; points?: number; reviewNote?: string }
  ) {
    const res = await api.patch<ApiResponse<ContributionItem>>(
      `/contributions/${id}/verify`,
      payload
    );
    return res.data.data;
  },

  async getLeaderboard(clubId: string) {
    const res = await api.get<
      ApiResponse<
        Array<{
          user: { id: string; fullName: string };
          totalPoints: number;
          totalHours: number;
          verifiedCount: number;
        }>
      >
    >(`/clubs/${clubId}/leaderboard`);
    return res.data.data;
  },
};
