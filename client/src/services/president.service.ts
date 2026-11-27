import { api } from './api';
import {
  ApiResponse,
  ApplicationStatus,
  Club,
  ClubEvent,
  ClubRole,
  ContributionItem,
  ContributionType,
  EventStatus,
  MembershipStatus,
  RecruitmentApplication,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../types';

export interface AnnouncementItem {
  id: string;
  clubId: string;
  title: string;
  content: string;
  createdById: string;
  isPinned: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  club: { id: string; name: string; slug: string };
  createdBy: { id: string; fullName: string };
}

export interface PresidentAuthorizedClub extends Club {
  myRole: ClubRole;
  activeTasksCount: number;
  pendingApplicationsCount: number;
}

export interface PresidentDashboardData {
  club: PresidentAuthorizedClub;
  authorizedClubs: PresidentAuthorizedClub[];
  overview: {
    totalMembers: number;
    pendingRequests: number;
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    pendingContributions: number;
    recruitmentApplications: number;
    upcomingEvents: number;
  };
  memberEngagement: {
    activeMembersCount: number;
    inactiveMembers: Array<{ userId: string; fullName: string; role: ClubRole }>;
    mostActiveMembers: Array<{
      userId: string;
      fullName: string;
      role: ClubRole;
      points: number;
      completedTasks: number;
    }>;
    engagementPercentage: number;
  };
  taskOverview: {
    byStatus: Record<TaskStatus, number>;
    nearingDeadline: TaskItem[];
    overdue: TaskItem[];
    recentlyCompleted: TaskItem[];
  };
  workloadDistribution: {
    members: Array<{
      userId: string;
      fullName: string;
      role: ClubRole;
      activeTasks: number;
      completedTasks: number;
    }>;
    overloadedMembers: Array<{ userId: string; fullName: string; activeTasks: number }>;
    lightLoadMembers: Array<{ userId: string; fullName: string; activeTasks: number }>;
    unassignedTasksCount: number;
    suggestedAssignee: { userId: string; fullName: string; activeTasks: number } | null;
  };
  contributionOverview: {
    totalVerified: number;
    totalVerifiedHours: number;
    totalVerifiedPoints: number;
    pendingVerifications: number;
    topContributors: Array<{ userId: string; fullName: string; points: number; hours: number }>;
  };
  recruitmentOverview: {
    total: number;
    SUBMITTED: number;
    UNDER_REVIEW: number;
    SHORTLISTED: number;
    ACCEPTED: number;
    REJECTED: number;
  };
  upcomingEvents: ClubEvent[];
  recentActivityFeed: Array<{
    id: string;
    kind: string;
    title: string;
    timestamp: string;
  }>;
}

export interface PresidentMemberRow {
  id: string;
  userId: string;
  clubId: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt: string;
  assignedTasks: number;
  completedTasks: number;
  verifiedContributions: number;
  totalPoints: number;
  totalHours: number;
  lastActivity: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    department: string | null;
    course: string | null;
    yearOfStudy: string | null;
    profileImage: string | null;
    bio: string | null;
    skills: string[];
  };
}

export const presidentService = {
  async getDashboard(clubId?: string) {
    const res = await api.get<ApiResponse<PresidentDashboardData>>('/president/dashboard', {
      params: clubId ? { clubId } : undefined,
    });
    return res.data.data;
  },

  async listAuthorizedClubs() {
    const res = await api.get<ApiResponse<PresidentAuthorizedClub[]>>('/president/clubs');
    return res.data.data;
  },

  async getClubDetail(clubId: string) {
    const res = await api.get<ApiResponse<PresidentAuthorizedClub & { requireVerification?: boolean; contributionPointsConfig?: Record<string, number> }>>(`/president/clubs/${clubId}`);
    return res.data.data;
  },

  async listMembers(
    clubId: string,
    params?: { search?: string; role?: string; status?: string; sort?: string }
  ) {
    const res = await api.get<ApiResponse<PresidentMemberRow[]>>(
      `/president/clubs/${clubId}/members`,
      { params }
    );
    return res.data.data;
  },

  async getMemberDetail(clubId: string, memberId: string) {
    const res = await api.get<
      ApiResponse<{
        membership: PresidentMemberRow;
        assignedTasks: TaskItem[];
        completedTasks: TaskItem[];
        contributions: ContributionItem[];
        verifiedPoints: number;
        eventsAttended: Array<{ id: string; event: { id: string; title: string; startDate: string } }>;
        recentActivities: Array<{ id: string; action: string; createdAt: string; task: { title: string } }>;
      }>
    >(`/president/clubs/${clubId}/members/${memberId}`);
    return res.data.data;
  },

  async updateMember(
    clubId: string,
    memberId: string,
    payload: { role?: ClubRole; status?: 'ACTIVE' | 'REMOVED' }
  ) {
    const res = await api.patch<ApiResponse<unknown>>(
      `/president/clubs/${clubId}/members/${memberId}`,
      payload
    );
    return res.data.data;
  },

  async listMembershipRequests(clubId: string) {
    const res = await api.get<
      ApiResponse<
        Array<{
          id: string;
          userId: string;
          clubId: string;
          status: MembershipStatus;
          joinedAt: string;
          user: {
            id: string;
            fullName: string;
            email: string;
            profileImage: string | null;
            department: string | null;
            course: string | null;
            yearOfStudy: string | null;
            skills: string[];
            interests: string[];
            bio: string | null;
          };
        }>
      >
    >(`/president/clubs/${clubId}/membership-requests`);
    return res.data.data;
  },

  async reviewMembershipRequest(
    clubId: string,
    requestId: string,
    payload: { status: 'ACTIVE' | 'REJECTED'; reason?: string }
  ) {
    const res = await api.patch<ApiResponse<unknown>>(
      `/president/clubs/${clubId}/membership-requests/${requestId}`,
      payload
    );
    return res.data.data;
  },

  async listTasksWithWorkload(clubId: string) {
    const res = await api.get<
      ApiResponse<{
        tasks: Array<
          TaskItem & {
            activities?: Array<{
              id: string;
              action: string;
              oldValue: string | null;
              newValue: string | null;
              createdAt: string;
              user: { fullName: string };
            }>;
          }
        >;
        membersWorkload: Array<{
          userId: string;
          fullName: string;
          role: ClubRole;
          activeTasksCount: number;
          isHighLoad: boolean;
        }>;
        suggestedAssignee: {
          userId: string;
          fullName: string;
          activeTasksCount: number;
        } | null;
      }>
    >(`/president/clubs/${clubId}/tasks`);
    return res.data.data;
  },

  async createTask(
    clubId: string,
    payload: {
      title: string;
      description: string;
      assignedToId?: string | null;
      priority: TaskPriority;
      status: TaskStatus;
      dueDate?: string | null;
    }
  ) {
    const res = await api.post<ApiResponse<TaskItem>>(
      `/president/clubs/${clubId}/tasks`,
      payload
    );
    return res.data.data;
  },

  async listContributions(clubId: string) {
    const res = await api.get<ApiResponse<ContributionItem[]>>(
      `/president/clubs/${clubId}/contributions`
    );
    return res.data.data;
  },

  async verifyContribution(
    contributionId: string,
    payload: { status: 'VERIFIED' | 'REJECTED'; points?: number; reviewNote?: string }
  ) {
    const res = await api.patch<ApiResponse<ContributionItem>>(
      `/president/contributions/${contributionId}/verify`,
      payload
    );
    return res.data.data;
  },

  async listRecruitment(clubId: string) {
    const res = await api.get<ApiResponse<RecruitmentApplication[]>>(
      `/president/clubs/${clubId}/recruitment`
    );
    return res.data.data;
  },

  async updateRecruitmentStatus(
    applicationId: string,
    status: ApplicationStatus,
    assignedRole?: ClubRole
  ) {
    const res = await api.patch<ApiResponse<RecruitmentApplication>>(
      `/president/recruitment/${applicationId}/status`,
      { status, ...(assignedRole ? { assignedRole } : {}) }
    );
    return res.data.data;
  },

  async listEvents(clubId: string) {
    const res = await api.get<ApiResponse<ClubEvent[]>>(`/president/clubs/${clubId}/events`);
    return res.data.data;
  },

  async createEvent(
    clubId: string,
    payload: {
      title: string;
      description: string;
      location: string;
      category: string;
      coverImage?: string | null;
      startDate: string;
      endDate?: string | null;
      capacity: number;
      status: EventStatus;
    }
  ) {
    const res = await api.post<ApiResponse<ClubEvent>>(
      `/president/clubs/${clubId}/events`,
      payload
    );
    return res.data.data;
  },

  async listAnnouncements(clubId: string) {
    const res = await api.get<ApiResponse<AnnouncementItem[]>>(
      `/president/clubs/${clubId}/announcements`
    );
    return res.data.data;
  },

  async createAnnouncement(
    clubId: string,
    payload: { title: string; content: string; isPinned: boolean }
  ) {
    const res = await api.post<ApiResponse<AnnouncementItem>>(
      `/president/clubs/${clubId}/announcements`,
      payload
    );
    return res.data.data;
  },

  async updateAnnouncement(
    id: string,
    payload: { title?: string; content?: string; isPinned?: boolean }
  ) {
    const res = await api.patch<ApiResponse<AnnouncementItem>>(
      `/president/announcements/${id}`,
      payload
    );
    return res.data.data;
  },

  async deleteAnnouncement(id: string) {
    await api.delete(`/president/announcements/${id}`);
  },

  async listMemberAnnouncements() {
    const res = await api.get<ApiResponse<AnnouncementItem[]>>('/announcements');
    return res.data.data;
  },

  async getAnalytics(
    clubId: string,
    params: { range: string; from?: string; to?: string }
  ) {
    const res = await api.get<
      ApiResponse<{
        dateRange: { startDate: string; endDate: string };
        engagement: {
          totalMembers: number;
          activeMembersCount: number;
          inactiveMembersCount: number;
          activePercentage: number;
          newMembersInRange: number;
        };
        tasks: {
          total: number;
          completed: number;
          pending: number;
          overdue: number;
          unassigned: number;
          avgCompletionHours: number;
          completionRate: number;
        };
        contributions: {
          verifiedCount: number;
          pendingCount: number;
          totalHours: number;
          totalPoints: number;
          byType: Array<{ type: ContributionType; count: number; points: number; hours: number }>;
        };
        workload: Array<{
          name: string;
          fullName: string;
          activeTasks: number;
          completedTasks: number;
        }>;
        recruitment: {
          total: number;
          accepted: number;
          rejected: number;
          acceptanceRate: number;
          rejectionRate: number;
        };
      }>
    >(`/president/clubs/${clubId}/analytics`, { params });
    return res.data.data;
  },

  async updateSettings(clubId: string, payload: Record<string, unknown>) {
    const res = await api.patch<ApiResponse<Club>>(
      `/president/clubs/${clubId}/settings`,
      payload
    );
    return res.data.data;
  },
};
