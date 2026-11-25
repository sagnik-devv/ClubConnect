import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Club } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { recruitmentService } from '../../services/recruitment.service';
import { getApiErrorMessage } from '../../services/api';

interface JoinClubModalProps {
  club: Club;
  open: boolean;
  onClose: () => void;
}

interface JoinFormValues {
  preferredRole: string;
  motivation: string;
  experience: string;
  skillsText: string;
}

export const JoinClubModal: React.FC<JoinClubModalProps> = ({ club, open, onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinFormValues>({
    defaultValues: {
      preferredRole: 'General Contributor',
      motivation: '',
      experience: '',
      skillsText: '',
    },
  });

  const applyMutation = useMutation({
    mutationFn: (payload: {
      preferredRole: string;
      motivation: string;
      experience?: string;
      skills: string[];
    }) => recruitmentService.submitApplication(club.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', club.slug] });
      queryClient.invalidateQueries({ queryKey: ['club', club.id] });
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      toast.success(`Application submitted to ${club.name}!`);
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to submit application'));
    },
  });

  const onSubmit = (data: JoinFormValues) => {
    applyMutation.mutate({
      preferredRole: data.preferredRole.trim(),
      motivation: data.motivation.trim(),
      experience: data.experience.trim() || undefined,
      skills: data.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Apply to ${club.name}`}
      subtitle={`Expected commitment: ${club.expectedTimeCommitment || 'Flexible'} · ${
        club.meetingSchedule || 'Weekly sessions'
      }`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 rounded-[8px] bg-[#f6f5f4] border border-black/[0.06] text-[13px] text-[#615d59]">
          <strong className="text-black">Before you apply:</strong> Your profile details (name, department, and year of study) are sent automatically with your application.
        </div>

        <div>
          <label htmlFor="join-role" className="block text-[13px] font-medium mb-1">
            Preferred Role or Pod *
          </label>
          <input
            id="join-role"
            type="text"
            placeholder="e.g. Frontend Contributor, Event Coordinator, General Member"
            {...register('preferredRole', { required: 'Preferred role is required' })}
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
          {errors.preferredRole && (
            <p className="mt-1 text-[12px] text-[#e32d14]">{errors.preferredRole.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="join-motivation" className="block text-[13px] font-medium mb-1">
            Why do you want to join? *
          </label>
          <textarea
            id="join-motivation"
            rows={3}
            placeholder="Share what excites you about this club and what you hope to build or learn..."
            {...register('motivation', {
              required: 'Please share a short note about your interest',
              minLength: { value: 10, message: 'Write at least 10 characters' },
            })}
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
          {errors.motivation && (
            <p className="mt-1 text-[12px] text-[#e32d14]">{errors.motivation.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="join-exp" className="block text-[13px] font-medium mb-1">
            Prior Experience (optional)
          </label>
          <textarea
            id="join-exp"
            rows={2}
            placeholder="Relevant projects, classes, or past student roles..."
            {...register('experience')}
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
        </div>

        <div>
          <label htmlFor="join-skills" className="block text-[13px] font-medium mb-1">
            Relevant Skills (comma-separated)
          </label>
          <input
            id="join-skills"
            type="text"
            placeholder={club.skills.slice(0, 3).join(', ') || 'React, Writing, CAD'}
            {...register('skillsText')}
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={applyMutation.isPending}>
            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
