import { GlobalRole } from '@prisma/client';

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
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
