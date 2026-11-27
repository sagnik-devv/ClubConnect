import { ClubRole } from '../types';

export const CLUB_ROLE_OPTIONS: Array<{ value: ClubRole; label: string }> = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'SECRETARY', label: 'Secretary' },
  { value: 'VICE_PRESIDENT', label: 'Vice President' },
  { value: 'PRESIDENT', label: 'President' },
];

export function formatClubRole(role?: ClubRole | null): string {
  if (!role) return 'Member';
  return CLUB_ROLE_OPTIONS.find((opt) => opt.value === role)?.label ?? role.replace('_', ' ');
}

export function suggestClubRole(
  preferredRole?: string | null,
  assignedRole?: ClubRole | null
): ClubRole {
  if (assignedRole) return assignedRole;
  const text = (preferredRole || '').toLowerCase();
  if (text.includes('vice')) return 'VICE_PRESIDENT';
  if (text.includes('secretary')) return 'SECRETARY';
  if (text.includes('treasurer') || text.includes('finance')) return 'TREASURER';
  if (text.includes('coordinator') || text.includes('lead') || text.includes('head')) {
    return 'COORDINATOR';
  }
  return 'MEMBER';
}
