import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Calendar, CheckSquare, Edit3, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { PresidentAuthorizedClub, presidentService } from '../../services/president.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  CLUB_AVATAR_PREFIX,
  ClubAvatarPicker,
  ClubLogoMark,
  getClubAvatarByValue,
} from '../../components/common/CharacterMarks';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';

interface ClubEditValues {
  name: string;
  shortDescription: string;
  description: string;
  mission: string;
  category: string;
  meetingSchedule: string;
  expectedTimeCommitment: string;
  requirementsText: string;
  logo: string;
  accentColor: string;
  coverImage: string;
  isRecruiting: boolean;
}

export const PresidentClubsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId?: string }>();
  const queryClient = useQueryClient();
  const { setSelectedClubId } = usePresidentClub();
  const [editingClub, setEditingClub] = useState<PresidentAuthorizedClub | null>(null);

  const { data: clubs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-clubs'],
    queryFn: presidentService.listAuthorizedClubs,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<ClubEditValues>();
  const watchedLogo = watch('logo');
  const watchedAccentColor = watch('accentColor');

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      presidentService.updateSettings(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Club details updated in PostgreSQL');
      setEditingClub(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update club'));
    },
  });

  const openEdit = (club: PresidentAuthorizedClub) => {
    setEditingClub(club);
    const fallbackAvatar = `${CLUB_AVATAR_PREFIX}${getClubAvatarByValue(club.logo, club.slug).id}`;
    reset({
      name: club.name,
      shortDescription: club.shortDescription,
      description: club.description,
      mission: club.mission || '',
      category: club.category,
      meetingSchedule: club.meetingSchedule || '',
      expectedTimeCommitment: club.expectedTimeCommitment || '',
      requirementsText: (club.requirements || []).join('\n'),
      logo: club.logo || fallbackAvatar,
      accentColor: club.accentColor || '#e6f3fe',
      coverImage: club.coverImage || '',
      isRecruiting: club.isRecruiting,
    });
  };

  const onSubmit = (vals: ClubEditValues) => {
    if (!editingClub) return;
    updateMutation.mutate({
      id: editingClub.id,
      payload: {
        name: vals.name.trim(),
        shortDescription: vals.shortDescription.trim(),
        description: vals.description.trim(),
        mission: vals.mission.trim() || null,
        category: vals.category,
        meetingSchedule: vals.meetingSchedule.trim() || null,
        expectedTimeCommitment: vals.expectedTimeCommitment.trim() || null,
        requirements: vals.requirementsText
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
        logo: vals.logo.trim() || null,
        accentColor: vals.accentColor || '#e6f3fe',
        coverImage: vals.coverImage.trim() || null,
        isRecruiting: vals.isRecruiting,
      },
    });
  };

  const visibleClubs = clubId ? clubs.filter((c) => c.id === clubId) : clubs;

  return (
    <PresidentLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">President Portal · Clubs</p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            Managed Clubs
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Update club identity, expectations, schedules, and recruitment visibility.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load authorized clubs')}
            onRetry={() => refetch()}
          />
        ) : visibleClubs.length === 0 ? (
          <EmptyState
            title="No authorized clubs found"
            description="You do not have leadership permissions for this club."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleClubs.map((club) => (
              <article key={club.id} className="notion-card p-6 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <ClubLogoMark
                        clubId={club.slug}
                        logo={club.logo}
                        accentColor={club.accentColor || '#e6f3fe'}
                        size={48}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="card-heading font-bold text-black">{club.name}</h2>
                          <Badge variant="blue">{club.myRole}</Badge>
                        </div>
                        <div className="text-[12px] text-[#757575]">{club.category}</div>
                      </div>
                    </div>
                    <Badge variant={club.isRecruiting ? 'green' : 'neutral'}>
                      {club.isRecruiting ? 'Recruiting' : 'Closed'}
                    </Badge>
                  </div>

                  <p className="mt-4 text-[14px] text-[#615d59] leading-[1.5]">
                    {club.shortDescription}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
                    <div className="p-2.5 rounded-[8px] bg-[#f6f5f4]">
                      <div className="text-[11px] text-[#757575] flex items-center gap-1">
                        <Users className="w-3 h-3" /> Members
                      </div>
                      <div className="font-bold text-black mt-0.5">{club.memberCount}</div>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[#f6f5f4]">
                      <div className="text-[11px] text-[#757575] flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> Active Tasks
                      </div>
                      <div className="font-bold text-black mt-0.5">{club.activeTasksCount}</div>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[#f6f5f4]">
                      <div className="text-[11px] text-[#757575] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Events
                      </div>
                      <div className="font-bold text-black mt-0.5">
                        {club.upcomingEventsCount ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedClubId(club.id)}
                    to="/president"
                  >
                    Switch & Open Dashboard
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => openEdit(club)}>
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Club
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editingClub)}
        onClose={() => setEditingClub(null)}
        title={`Edit ${editingClub?.name || 'Club'}`}
        subtitle="Changes persist directly in PostgreSQL and appear in the Member Portal."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ClubAvatarPicker
            clubSlug={editingClub?.slug || 'club'}
            selectedLogo={watchedLogo}
            selectedTint={watchedAccentColor || '#e6f3fe'}
            onSelectLogo={(logo) => setValue('logo', logo, { shouldDirty: true })}
            onSelectTint={(color) => setValue('accentColor', color, { shouldDirty: true })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium mb-1">Club Name</label>
              <input
                type="text"
                {...register('name', { required: true })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1">Category</label>
              <input
                type="text"
                {...register('category', { required: true })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1">Short Description</label>
            <input
              type="text"
              {...register('shortDescription', { required: true })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1">Full Description</label>
            <textarea
              rows={3}
              {...register('description', { required: true })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1">Mission</label>
            <textarea
              rows={2}
              {...register('mission')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium mb-1">Meeting Schedule</label>
              <input
                type="text"
                {...register('meetingSchedule')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1">Expected Time Commitment</label>
              <input
                type="text"
                {...register('expectedTimeCommitment')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium mb-1">
                Custom Logo URL or Preset ID
              </label>
              <input
                type="text"
                placeholder="club-avatar:code or https://..."
                {...register('logo')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1">Cover Image URL (optional)</label>
              <input
                type="text"
                {...register('coverImage')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1">
              Member Requirements (one per line)
            </label>
            <textarea
              rows={2}
              {...register('requirementsText')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-[14px] font-medium cursor-pointer">
            <input type="checkbox" {...register('isRecruiting')} className="accent-[#0075de]" />
            Recruitment open for applications
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingClub(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </PresidentLayout>
  );
};
