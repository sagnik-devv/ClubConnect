import { z } from 'zod';
import {
  ApplicationStatus,
  ContributionStatus,
  ContributionType,
  EventStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(3000),
  clubId: z.string().uuid(),
  assignedToId: z.string().uuid().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().min(2).max(3000).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const assignTaskSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
});

export const createContributionSchema = z.object({
  clubId: z.string().uuid(),
  taskId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(5).max(3000),
  contributionType: z.nativeEnum(ContributionType),
  hoursSpent: z.coerce.number().min(0).max(500),
});

export const updateContributionSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().min(5).max(3000).optional(),
  contributionType: z.nativeEnum(ContributionType).optional(),
  hoursSpent: z.coerce.number().min(0).max(500).optional(),
});

export const verifyContributionSchema = z.object({
  status: z.enum([ContributionStatus.VERIFIED, ContributionStatus.REJECTED]),
  points: z.coerce.number().int().min(0).max(500).optional(),
  reviewNote: z.string().trim().max(500).optional(),
});

export const createEventSchema = z.object({
  clubId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(5).max(4000),
  location: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(60).default('Workshop'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(10000),
  status: z.nativeEnum(EventStatus).default(EventStatus.UPCOMING),
});

export const updateEventSchema = createEventSchema.omit({ clubId: true }).partial();

export const createApplicationSchema = z.object({
  motivation: z.string().trim().min(10, 'Please share at least 10 characters').max(3000),
  skills: z.array(z.string().trim().min(1)).default([]),
  experience: z.string().trim().max(2000).optional(),
  preferredRole: z.string().trim().min(2).max(120),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  onboardingStep: z.coerce.number().int().min(1).max(6).optional(),
});

export const updateApplicationNotesSchema = z.object({
  reviewNotes: z.string().trim().max(2000),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  department: z.string().trim().max(100).nullable().optional(),
  course: z.string().trim().max(100).nullable().optional(),
  yearOfStudy: z.string().trim().max(50).nullable().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  interests: z.array(z.string().trim().min(1)).optional(),
});
