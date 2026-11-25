import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedHeadline } from '../animations/AnimatedHeadline';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { clubService } from '../../services/club.service';
import { getApiErrorMessage } from '../../services/api';

interface CreateClubFormValues {
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  expectedTimeCommitment: string;
  meetingSchedule: string;
  skillsText: string;
}

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, refreshSession } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClubFormValues>({
    defaultValues: {
      category: 'Technology',
      expectedTimeCommitment: '3–4 hrs / week',
    },
  });

  const createMutation = useMutation({
    mutationFn: clubService.createClub,
    onSuccess: async (club) => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['platform-summary'] });
      toast.success(`${club.name} created!`);
      reset();
      setModalOpen(false);
      navigate(`/clubs/${club.slug}`);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Unable to create club'));
    },
  });

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      toast.info('Sign in or create an account first to launch a club');
      navigate('/login');
      return;
    }
    setModalOpen(true);
  };

  const onSubmit = (values: CreateClubFormValues) => {
    createMutation.mutate({
      name: values.name.trim(),
      category: values.category,
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      expectedTimeCommitment: values.expectedTimeCommitment.trim(),
      meetingSchedule: values.meetingSchedule.trim() || undefined,
      skills: values.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isRecruiting: true,
    });
  };

  return (
    <section className="py-20 border-t border-black/[0.08]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="notion-card p-8 sm:p-12 lg:p-16 text-center bg-white">
          <div className="max-w-3xl mx-auto">
            <AnimatedHeadline
              text="Your next opportunity starts with getting involved."
              className="section-heading text-[34px] sm:text-[48px] lg:text-[54px] font-bold text-black"
            />
            <p className="mt-4 text-[18px] text-[#615d59] font-editorial">
              Explore transparent campus communities or launch a club workspace built around shared responsibility.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="lg" to="/clubs">
                Find Your Club
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" />
                Create a Club
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create a Club Workspace"
        subtitle="Set clear expectations from day one so new members know what they are joining."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="club-name" className="block text-[13px] font-medium mb-1">
                Club Name *
              </label>
              <input
                id="club-name"
                type="text"
                placeholder="e.g. Coding Club"
                {...register('name', { required: 'Club name is required' })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
              {errors.name && <p className="mt-1 text-[12px] text-[#e32d14]">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="club-category" className="block text-[13px] font-medium mb-1">
                Category
              </label>
              <select
                id="club-category"
                {...register('category')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px] bg-white"
              >
                <option value="Technology">Technology</option>
                <option value="Engineering">Engineering</option>
                <option value="Arts & Media">Arts & Media</option>
                <option value="Business">Business</option>
                <option value="Culture">Culture</option>
                <option value="Debate & Policy">Debate & Policy</option>
                <option value="Design">Design</option>
                <option value="Sports">Sports</option>
                <option value="Literature">Literature</option>
                <option value="Innovation">Innovation</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="club-short" className="block text-[13px] font-medium mb-1">
              Short Summary *
            </label>
            <input
              id="club-short"
              type="text"
              placeholder="What does your club actually build or do?"
              {...register('shortDescription', {
                required: 'Short summary is required',
                minLength: { value: 5, message: 'At least 5 characters' },
              })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
            {errors.shortDescription && (
              <p className="mt-1 text-[12px] text-[#e32d14]">{errors.shortDescription.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="club-desc" className="block text-[13px] font-medium mb-1">
              Full Description *
            </label>
            <textarea
              id="club-desc"
              rows={3}
              placeholder="Describe how members collaborate and what a typical week looks like..."
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'At least 10 characters' },
              })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
            {errors.description && (
              <p className="mt-1 text-[12px] text-[#e32d14]">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="club-time" className="block text-[13px] font-medium mb-1">
                Expected Weekly Time
              </label>
              <input
                id="club-time"
                type="text"
                {...register('expectedTimeCommitment')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label htmlFor="club-schedule" className="block text-[13px] font-medium mb-1">
                Meeting Schedule
              </label>
              <input
                id="club-schedule"
                type="text"
                placeholder="Thursdays, 5:30 PM · Hall 201"
                {...register('meetingSchedule')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="club-skills" className="block text-[13px] font-medium mb-1">
              Skills Students Can Develop (comma-separated)
            </label>
            <input
              id="club-skills"
              type="text"
              placeholder="TypeScript, Prototyping, Public Speaking"
              {...register('skillsText')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Publishing...' : 'Publish Club Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
