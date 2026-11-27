import { z } from 'zod';
import { ClubRole, MembershipStatus } from '@prisma/client';

export const createClubSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(4000),
  shortDescription: z.string().trim().min(5).max(300),
  category: z.string().trim().min(2).max(80),
  logo: z.string().trim().max(500).nullable().optional(),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  mission: z.string().trim().max(2000).optional(),
  meetingSchedule: z.string().trim().max(200).optional(),
  expectedTimeCommitment: z.string().trim().max(120).optional(),
  requirements: z.array(z.string().trim().min(1)).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  interests: z.array(z.string().trim().min(1)).optional(),
  location: z.string().trim().max(200).optional(),
  isRecruiting: z.boolean().optional(),
});

export const updateClubSchema = createClubSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateMembershipRequestSchema = z.object({
  status: z.enum([MembershipStatus.ACTIVE, MembershipStatus.REJECTED, MembershipStatus.REMOVED]),
  role: z.nativeEnum(ClubRole).optional(),
});
