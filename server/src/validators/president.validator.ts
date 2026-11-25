import { z } from 'zod';
import { ClubRole, ContributionType, EventStatus, MembershipStatus } from '@prisma/client';

export const updateMemberSchema = z.object({
  role: z.nativeEnum(ClubRole).optional(),
  status: z.enum([MembershipStatus.ACTIVE, MembershipStatus.REMOVED]).optional(),
});

export const membershipDecisionSchema = z.object({
  status: z.enum([MembershipStatus.ACTIVE, MembershipStatus.REJECTED]),
  reason: z.string().trim().max(500).optional(),
});

export const presidentCreateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(3000),
  assignedToId: z.string().uuid().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']).default('TODO'),
  dueDate: z.string().datetime().nullable().optional(),
});

export const presidentCreateEventSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(5).max(4000),
  location: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(60).default('Workshop'),
  coverImage: z.string().trim().url().nullable().optional().or(z.literal('')),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(10000),
  status: z.nativeEnum(EventStatus).default(EventStatus.UPCOMING),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(5).max(5000),
  isPinned: z.boolean().default(false),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const updateClubSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(10).max(4000).optional(),
  shortDescription: z.string().trim().min(5).max(300).optional(),
  mission: z.string().trim().max(2000).nullable().optional(),
  category: z.string().trim().min(2).max(80).optional(),
  logo: z.string().trim().max(500).nullable().optional(),
  coverImage: z.string().trim().max(500).nullable().optional(),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  meetingSchedule: z.string().trim().max(200).nullable().optional(),
  expectedTimeCommitment: z.string().trim().max(120).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  requirements: z.array(z.string().trim().min(1)).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  isRecruiting: z.boolean().optional(),
  requireVerification: z.boolean().optional(),
  contributionPointsConfig: z
    .record(z.nativeEnum(ContributionType), z.coerce.number().int().min(0).max(500))
    .optional(),
  transferPresidentToUserId: z.string().uuid().optional(),
  archiveClub: z.boolean().optional(),
});
