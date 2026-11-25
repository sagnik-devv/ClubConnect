import React from 'react';
import { ArrowRight, Clock, Users } from 'lucide-react';
import { Club } from '../../types';
import { ClubLogoMark } from '../common/CharacterMarks';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface ClubCardProps {
  club: Club;
  viewMode: 'grid' | 'list';
  isJoined?: boolean;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, viewMode, isJoined }) => {
  if (viewMode === 'list') {
    return (
      <article className="notion-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/20">
        <div className="flex items-start gap-4 min-w-0">
          <ClubLogoMark clubId={club.slug} accentColor={club.accentColor || '#e6f3fe'} size={52} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[19px] font-bold text-black tracking-[-0.015em]">
                {club.name}
              </h2>
              <Badge variant="neutral">{club.category}</Badge>
              <Badge variant={club.isRecruiting ? 'blue' : 'neutral'}>
                {club.isRecruiting ? 'Recruiting' : 'Closed'}
              </Badge>
              {isJoined && <Badge variant="green">Joined</Badge>}
            </div>
            <p className="mt-1.5 text-[14px] text-[#615d59] line-clamp-2 max-w-2xl">
              {club.shortDescription}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[#615d59]">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {club.memberCount} members
              </span>
              {club.expectedTimeCommitment && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {club.expectedTimeCommitment}
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {club.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full bg-[#f6f5f4] text-[12px] text-black/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button variant="secondary" to={`/clubs/${club.slug}`}>
            View Details
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="notion-card p-6 h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <ClubLogoMark clubId={club.slug} accentColor={club.accentColor || '#e6f3fe'} size={48} />
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {isJoined && <Badge variant="green">Joined</Badge>}
            <Badge variant={club.isRecruiting ? 'blue' : 'neutral'}>
              {club.isRecruiting ? 'Recruiting' : 'Closed'}
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[12px] font-medium text-[#757575]">{club.category}</span>
          <h2 className="mt-0.5 card-heading font-bold text-black">{club.name}</h2>
          <p className="mt-2 text-[14px] text-[#615d59] leading-[1.5] line-clamp-3">
            {club.shortDescription}
          </p>
        </div>

        {club.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {club.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 rounded-full bg-[#f6f5f4] border border-black/[0.06] text-[12px] text-black/80"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-black/[0.08] flex items-center justify-between gap-3">
        <div className="text-[13px] text-[#615d59] flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {club.memberCount}
          </span>
          {club.expectedTimeCommitment && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {club.expectedTimeCommitment}
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" to={`/clubs/${club.slug}`}>
          View Details
        </Button>
      </div>
    </article>
  );
};
