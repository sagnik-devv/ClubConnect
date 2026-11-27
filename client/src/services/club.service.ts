import { api } from './api';
import {
  ApiResponse,
  Club,
  ClubManagementAnalytics,
  ClubMember,
  ClubRole,
  MembershipStatus,
} from '../types';

export interface ClubsListResponse {
  items: Club[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const clubService = {
  async listClubs(params?: {
    search?: string;
    category?: string;
    recruiting?: string;
    interest?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await api.get<ApiResponse<ClubsListResponse>>('/clubs', { params });
    return res.data.data;
  },

  async getClub(idOrSlug: string) {
    const res = await api.get<ApiResponse<Club>>(`/clubs/${idOrSlug}`);
    return res.data.data;
  },

  async createClub(payload: {
    name: string;
    description: string;
    shortDescription: string;
    category: string;
    logo?: string | null;
    accentColor?: string;
    mission?: string;
    meetingSchedule?: string;
    expectedTimeCommitment?: string;
    requirements?: string[];
    skills?: string[];
    interests?: string[];
    location?: string;
    isRecruiting?: boolean;
  }) {
    const res = await api.post<ApiResponse<Club>>('/clubs', payload);
    return res.data.data;
  },

  async updateClub(id: string, payload: Partial<Club>) {
    const res = await api.patch<ApiResponse<Club>>(`/clubs/${id}`, payload);
    return res.data.data;
  },

  async joinClub(id: string) {
    const res = await api.post<ApiResponse<unknown>>(`/clubs/${id}/join`);
    return res.data.data;
  },

  async leaveClub(id: string) {
    const res = await api.post<ApiResponse<unknown>>(`/clubs/${id}/leave`);
    return res.data.data;
  },

  async getMembers(id: string) {
    const res = await api.get<ApiResponse<ClubMember[]>>(`/clubs/${id}/members`);
    return res.data.data;
  },

  async getStatistics(id: string) {
    const res = await api.get<ApiResponse<ClubManagementAnalytics>>(`/clubs/${id}/statistics`);
    return res.data.data;
  },

  async listMembershipRequests(id: string) {
    const res = await api.get<ApiResponse<ClubMember[]>>(`/clubs/${id}/membership-requests`);
    return res.data.data;
  },

  async reviewMembershipRequest(
    clubId: string,
    requestId: string,
    payload: { status: MembershipStatus; role?: ClubRole }
  ) {
    const res = await api.patch<ApiResponse<ClubMember>>(
      `/clubs/${clubId}/membership-requests/${requestId}`,
      payload
    );
    return res.data.data;
  },
};
