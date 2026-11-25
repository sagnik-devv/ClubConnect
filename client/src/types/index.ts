export type GlobalRole = 'STUDENT' | 'SUPER_ADMIN';
export type ClubRole =
  | 'MEMBER'
  | 'PRESIDENT'
  | 'VICE_PRESIDENT'
  | 'SECRETARY'
  | 'TREASURER'
  | 'COORDINATOR';
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'LEFT' | 'REMOVED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ContributionType =
  | 'TASK'
  | 'EVENT'
  | 'PROJECT'
  | 'LEADERSHIP'
  | 'VOLUNTEERING'
  | 'OTHER';
export type ContributionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'REJECTED';

export type NotificationType =
  | 'REGISTRATION'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_DECISION'
  | 'TASK_ASSIGNED'
  | 'TASK_DEADLINE'
  | 'TASK_STATUS'
  | 'CONTRIBUTION_SUBMITTED'
  | 'CONTRIBUTION_REVIEWED'
  | 'EVENT_CREATED'
  | 'EVENT_REGISTERED'
  | 'ANNOUNCEMENT';

export interface UserMembership {
  id: string;
  userId: string;
  clubId: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt: string;
  club: {
    id: string;
    name: string;
    slug: string;
    category: string;
    accentColor: string;
  };
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  department: string | null;
  course: string | null;
  yearOfStudy: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  globalRole: GlobalRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  memberships: UserMembership[];
}

export interface ClubLeaderItem {
  membershipId: string;
  role: ClubRole;
  user: {
    id: string;
    fullName: string;
    profileImage: string | null;
    department: string | null;
    yearOfStudy: string | null;
  };
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  logo: string | null;
  coverImage: string | null;
  accentColor: string;
  mission: string | null;
  meetingSchedule: string | null;
  expectedTimeCommitment: string | null;
  requirements: string[];
  skills: string[];
  interests: string[];
  location: string | null;
  isRecruiting: boolean;
  isActive: boolean;
  memberCount: number;
  upcomingEventsCount?: number;
  leadership: ClubLeaderItem[];
  events?: ClubEvent[];
  userMembership?: {
    id: string;
    role: ClubRole;
    status: MembershipStatus;
  } | null;
  userApplication?: RecruitmentApplication | null;
}

export interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    profileImage: string | null;
    department: string | null;
    course: string | null;
    yearOfStudy: string | null;
    skills: string[];
  };
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  clubId: string;
  createdById: string;
  assignedToId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  club: { id: string; name: string; slug: string };
  assignedTo: { id: string; fullName: string; profileImage?: string | null } | null;
  createdBy?: { id: string; fullName: string };
}

export interface ContributionItem {
  id: string;
  userId: string;
  clubId: string;
  taskId: string | null;
  title: string;
  description: string;
  contributionType: ContributionType;
  hoursSpent: number;
  points: number;
  status: ContributionStatus;
  verifiedById: string | null;
  reviewNote: string | null;
  createdAt: string;
  club: { id: string; name: string; slug?: string };
  user: { id: string; fullName: string; profileImage?: string | null };
  verifiedBy?: { id: string; fullName: string } | null;
  task?: { id: string; title: string } | null;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location: string;
  category: string;
  coverImage?: string | null;
  startDate: string;
  endDate: string | null;
  capacity: number;
  status: EventStatus;
  registeredCount: number;
  isRegistered: boolean;
  club: { id: string; name: string; slug: string };
}

export interface RecruitmentApplication {
  id: string;
  userId: string;
  clubId: string;
  motivation: string;
  skills: string[];
  experience: string | null;
  preferredRole: string;
  status: ApplicationStatus;
  reviewNotes: string | null;
  onboardingStep: number;
  appliedAt: string;
  updatedAt: string;
  club: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    expectedTimeCommitment?: string | null;
  };
  user?: {
    id: string;
    fullName: string;
    email?: string;
    department?: string | null;
    course?: string | null;
    yearOfStudy?: string | null;
  };
  reviewedBy?: { id: string; fullName: string } | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface StudentAnalytics {
  summary: {
    activeMemberships: number;
    pendingApplications: number;
    assignedTasks: number;
    completedTasks: number;
    pendingTasks: number;
    verifiedContributions: number;
    totalVerifiedPoints: number;
    totalVerifiedHours: number;
    upcomingEventsCount: number;
  };
  clubs: Array<{
    membershipId: string;
    role: ClubRole;
    joinedAt: string;
    club: Club;
  }>;
  tasks: TaskItem[];
  upcomingEvents: ClubEvent[];
  weeklyActivity: Array<{
    week: string;
    tasksCompleted: number;
    contributionsLogged: number;
  }>;
  recentContributions: ContributionItem[];
  recentTaskActivities: Array<{
    id: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    task: { id: string; title: string; club: { name: string } };
  }>;
}

export interface ClubManagementAnalytics {
  summary: {
    totalActiveMembers: number;
    pendingMembershipRequests: number;
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    pendingContributions: number;
    pendingRecruitmentApplications: number;
    upcomingEvents: number;
    participationRate: number;
  };
  memberRoster: Array<{
    membershipId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      department: string | null;
      yearOfStudy: string | null;
      profileImage: string | null;
    };
    role: ClubRole;
    joinedAt: string;
    assignedTasks: number;
    completedTasks: number;
    verifiedContributions: number;
    totalPoints: number;
    totalHours: number;
  }>;
  workloadDistribution: Array<{
    name: string;
    fullName: string;
    activeTasks: number;
    completedTasks: number;
  }>;
  leaderboard: Array<{
    user: { id: string; fullName: string };
    totalPoints: number;
    totalHours: number;
    verifiedCount: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
}
