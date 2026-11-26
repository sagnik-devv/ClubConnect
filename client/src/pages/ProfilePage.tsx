import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { Avatar } from '../components/common/Avatar';
import { CharacterAvatarPicker } from '../components/common/CharacterMarks';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { userService } from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';

interface ProfileFormValues {
  fullName: string;
  department: string;
  course: string;
  yearOfStudy: string;
  bio: string;
  skillsText: string;
  interestsText: string;
}

export const ProfilePage: React.FC = () => {
  const { refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userService.getMe,
  });

  const { register, handleSubmit } = useForm<ProfileFormValues>({
    values: profile
      ? {
          fullName: profile.fullName,
          department: profile.department || '',
          course: profile.course || '',
          yearOfStudy: profile.yearOfStudy || '',
          bio: profile.bio || '',
          skillsText: (profile.skills || []).join(', '),
          interestsText: (profile.interests || []).join(', '),
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: async () => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update profile'));
    },
  });

  const avatarMutation = useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: async () => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile avatar updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to upload image'));
    },
  });

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <PageSkeleton />
      </WorkspaceLayout>
    );
  }

  if (isError || !profile) {
    return (
      <WorkspaceLayout>
        <ErrorState
          message={getApiErrorMessage(error, 'Could not load profile')}
          onRetry={() => refetch()}
        />
      </WorkspaceLayout>
    );
  }

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate({
      fullName: values.fullName.trim(),
      department: values.department.trim() || null,
      course: values.course.trim() || null,
      yearOfStudy: values.yearOfStudy.trim() || null,
      bio: values.bio.trim() || null,
      skills: values.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      interests: values.interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">Account & Profile</p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            {profile.fullName}
          </h1>
          <p className="text-[14px] text-[#615d59]">{profile.email}</p>
        </div>

        {/* Avatar Upload & Character Picker */}
        <section className="notion-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                initials={profile.fullName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                profileImage={profile.profileImage}
                seed={profile.id}
                size="xl"
              />
              <div>
                <div className="font-semibold text-black">Profile Picture</div>
                <div className="text-[13px] text-[#615d59]">
                  Pick a funky ClubConnect character or upload JPEG/PNG/WebP up to 5MB.
                </div>
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) avatarMutation.mutate(file);
                }}
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarMutation.isPending}
              >
                <Camera className="w-4 h-4" />
                {avatarMutation.isPending ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-[#615d59]">
              Quick Character Avatars
            </span>
            <CharacterAvatarPicker
              selectedValue={profile.profileImage}
              onSelect={(val) => {
                if (val) updateMutation.mutate({ profileImage: val });
              }}
              size={40}
              className="sm:justify-end"
            />
          </div>
        </section>

        {/* Edit Details */}
        <section className="notion-card p-6">
          <h2 className="card-heading font-bold text-black mb-4">Personal Details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="block text-[13px] font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  {...register('fullName', { required: true })}
                  className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                />
              </div>
              <div>
                <label htmlFor="prof-dept" className="block text-[13px] font-medium mb-1">
                  Department
                </label>
                <input
                  id="prof-dept"
                  type="text"
                  {...register('department')}
                  className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-course" className="block text-[13px] font-medium mb-1">
                  Course
                </label>
                <input
                  id="prof-course"
                  type="text"
                  {...register('course')}
                  className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                />
              </div>
              <div>
                <label htmlFor="prof-year" className="block text-[13px] font-medium mb-1">
                  Year of Study
                </label>
                <input
                  id="prof-year"
                  type="text"
                  {...register('yearOfStudy')}
                  className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prof-bio" className="block text-[13px] font-medium mb-1">
                Bio
              </label>
              <textarea
                id="prof-bio"
                rows={3}
                {...register('bio')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-skills" className="block text-[13px] font-medium mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  id="prof-skills"
                  type="text"
                  {...register('skillsText')}
                  className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                />
              </div>
              <div>
                <label htmlFor="prof-interests" className="block text-[13px] font-medium mb-1">
                  Interests (comma-separated)
                </label>
                <input
                  id="prof-interests"
                  type="text"
                  {...register('interestsText')}
                  className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                />
              </div>
            </div>

            <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </section>

        {/* Memberships */}
        <section className="notion-card p-6">
          <h2 className="card-heading font-bold text-black mb-4">My Club Memberships</h2>
          {profile.memberships.length === 0 ? (
            <p className="text-[14px] text-[#615d59]">No club memberships yet.</p>
          ) : (
            <div className="space-y-2.5">
              {profile.memberships.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-[8px] bg-[#f6f5f4] flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-black">{m.club.name}</div>
                    <div className="text-[12px] text-[#615d59]">{m.club.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">{m.role}</Badge>
                    <Badge variant={m.status === 'ACTIVE' ? 'green' : 'marigold'}>
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceLayout>
  );
};
