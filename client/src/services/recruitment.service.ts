import { api } from './api';
import { ApiResponse, ApplicationStatus, RecruitmentApplication } from '../types';

export const recruitmentService = {
  async getOverview() {
    const res = await api.get<
      ApiResponse<{
        myApplications: RecruitmentApplication[];
        manageableApplications: RecruitmentApplication[];
      }>
    >('/recruitment');
    return res.data.data;
  },

  async submitApplication(
    clubId: string,
    payload: {
      motivation: string;
      skills: string[];
      experience?: string;
      preferredRole: string;
    }
  ) {
    const res = await api.post<ApiResponse<RecruitmentApplication>>(
      `/clubs/${clubId}/applications`,
      payload
    );
    return res.data.data;
  },

  async updateStatus(id: string, status: ApplicationStatus, onboardingStep?: number) {
    const res = await api.patch<ApiResponse<RecruitmentApplication>>(
      `/recruitment/${id}/status`,
      { status, onboardingStep }
    );
    return res.data.data;
  },

  async updateNotes(id: string, reviewNotes: string) {
    const res = await api.patch<ApiResponse<RecruitmentApplication>>(
      `/recruitment/${id}/notes`,
      { reviewNotes }
    );
    return res.data.data;
  },

  async updateOnboarding(id: string, onboardingStep: number) {
    const res = await api.patch<ApiResponse<RecruitmentApplication>>(
      `/recruitment/${id}/onboarding`,
      { onboardingStep }
    );
    return res.data.data;
  },
};
