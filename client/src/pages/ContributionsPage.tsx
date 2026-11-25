import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Check, Clock, Plus, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { contributionService } from '../services/contribution.service';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { getApiErrorMessage } from '../services/api';
import { ContributionItem, ContributionType } from '../types';

interface LogContributionValues {
  clubId: string;
  contributionType: ContributionType;
  title: string;
  description: string;
  hoursSpent: number;
}

export const ContributionsPage: React.FC = () => {
  const { user, hasClubLeadership } = useAuth();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const activeClubs = (user?.memberships ?? []).filter((m) => m.status === 'ACTIVE');

  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['contributions'],
    queryFn: () => contributionService.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogContributionValues>({
    defaultValues: {
      clubId: activeClubs[0]?.clubId || '',
      contributionType: 'TASK',
      hoursSpent: 2,
    },
  });

  const submitMutation = useMutation({
    mutationFn: contributionService.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      toast.success('Contribution submitted for leader verification');
      reset();
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not submit contribution'));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED';
      reviewNote?: string;
    }) => contributionService.verify(id, { status, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['club-stats'] });
      toast.success('Contribution review saved');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not review contribution'));
    },
  });

  const myVerified = useMemo(
    () => items.filter((c) => c.userId === user?.id && c.status === 'VERIFIED'),
    [items, user?.id]
  );

  const totalPoints = myVerified.reduce((acc, c) => acc + c.points, 0);
  const totalHours = Number(myVerified.reduce((acc, c) => acc + c.hoursSpent, 0).toFixed(1));
  const pendingCount = items.filter((c) => c.status === 'PENDING').length;

  const clubBreakdown = useMemo(() => {
    const map = new Map<string, { club: string; verifiedPoints: number; count: number }>();
    items
      .filter((c) => c.status === 'VERIFIED')
      .forEach((c) => {
        const prev = map.get(c.club.name) || { club: c.club.name, verifiedPoints: 0, count: 0 };
        prev.verifiedPoints += c.points;
        prev.count += 1;
        map.set(c.club.name, prev);
      });
    return Array.from(map.values());
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterStatus === 'ALL') return items;
    return items.filter((c) => c.status === filterStatus);
  }, [items, filterStatus]);

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <PageSkeleton />
      </WorkspaceLayout>
    );
  }

  if (isError) {
    return (
      <WorkspaceLayout>
        <ErrorState
          message={getApiErrorMessage(error, 'Could not load contributions')}
          onRetry={() => refetch()}
        />
      </WorkspaceLayout>
    );
  }

  const onSubmit = (vals: LogContributionValues) => {
    submitMutation.mutate({
      clubId: vals.clubId,
      contributionType: vals.contributionType,
      title: vals.title.trim(),
      description: vals.description.trim(),
      hoursSpent: Number(vals.hoursSpent),
    });
  };

  return (
    <WorkspaceLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">Contribution Tracking</p>
          <h1 className="mt-1 text-[32px] sm:text-[42px] font-bold text-black tracking-[-0.035em] leading-tight">
            Every verified contribution counts.
          </h1>
          <p className="mt-2 text-[15px] text-[#615d59] font-editorial max-w-2xl">
            Submit tasks, events, projects, or volunteering hours. Club leaders verify submissions before points count toward analytics.
          </p>
        </div>

        {activeClubs.length > 0 && (
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Submit Contribution
          </Button>
        )}
      </div>

      {/* Verified Summary */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="notion-card p-5 bg-[#e6f3fe] border-[#0075de]/15">
          <div className="text-[13px] text-[#0075de] font-medium flex items-center justify-between">
            Verified Points
            <Award className="w-4 h-4" />
          </div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={totalPoints} />
          </div>
          <div className="mt-1.5 text-[12px] text-[#615d59]">
            From {myVerified.length} verified records
          </div>
        </div>

        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59] flex items-center justify-between">
            Verified Hours
            <Clock className="w-4 h-4 text-[#0075de]" />
          </div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            {totalHours}h
          </div>
          <div className="mt-1.5 text-[12px] text-[#615d59]">Across active clubs</div>
        </div>

        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Pending Verification</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={pendingCount} />
          </div>
          <div className="mt-1.5 text-[12px] text-[#615d59]">Awaiting leader review</div>
        </div>
      </div>

      {/* Club Distribution Chart */}
      {clubBreakdown.length > 0 && (
        <section className="mt-8 notion-card p-6">
          <h2 className="card-heading font-bold text-black">Verified Points by Club</h2>
          <p className="text-[13px] text-[#615d59] mb-4">
            Aggregated exclusively from verified contributions.
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clubBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="club" tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="verifiedPoints" name="Verified Points" fill="#0075de" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Timeline & Verification List */}
      <section className="mt-8 notion-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="card-heading font-bold text-black">Contribution Records</h2>
          <select
            aria-label="Filter contribution status"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED')
            }
            className="px-3 py-1.5 rounded-[8px] border border-black/15 bg-white text-[13px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            title="No contributions found"
            description="Submit a contribution after completing a task, project, or event."
            action={
              activeClubs.length > 0 ? (
                <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                  Submit Contribution
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((entry: ContributionItem) => {
              const canVerify =
                entry.status === 'PENDING' &&
                entry.userId !== user?.id &&
                hasClubLeadership(entry.clubId);

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="peach">{entry.contributionType}</Badge>
                      <span className="text-[12px] font-semibold text-[#0075de]">
                        {entry.club.name}
                      </span>
                      <Badge
                        variant={
                          entry.status === 'VERIFIED'
                            ? 'green'
                            : entry.status === 'REJECTED'
                            ? 'coral'
                            : 'marigold'
                        }
                      >
                        {entry.status}
                      </Badge>
                      {entry.status === 'VERIFIED' && (
                        <Badge variant="blue">+{entry.points} pts</Badge>
                      )}
                    </div>
                    <h3 className="mt-2 text-[15px] font-semibold text-black">{entry.title}</h3>
                    <p className="mt-1 text-[13px] text-[#615d59]">{entry.description}</p>
                    <div className="mt-1.5 text-[12px] text-[#757575]">
                      By {entry.user.fullName} · {entry.hoursSpent} hrs ·{' '}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {canVerify && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          verifyMutation.mutate({ id: entry.id, status: 'VERIFIED' })
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        Verify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          verifyMutation.mutate({
                            id: entry.id,
                            status: 'REJECTED',
                            reviewNote: 'Needs more detail',
                          })
                        }
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit a Contribution"
        subtitle="Leaders in your club will review and verify awarded points."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="con-club" className="block text-[13px] font-medium mb-1">
                Club *
              </label>
              <select
                id="con-club"
                {...register('clubId', { required: 'Select a club' })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                {activeClubs.map((m) => (
                  <option key={m.clubId} value={m.clubId}>
                    {m.club.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="con-type" className="block text-[13px] font-medium mb-1">
                Type *
              </label>
              <select
                id="con-type"
                {...register('contributionType')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                <option value="TASK">Task</option>
                <option value="EVENT">Event</option>
                <option value="PROJECT">Project</option>
                <option value="LEADERSHIP">Leadership</option>
                <option value="VOLUNTEERING">Volunteering</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="con-title" className="block text-[13px] font-medium mb-1">
              Summary Title *
            </label>
            <input
              id="con-title"
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
            {errors.title && <p className="mt-1 text-[12px] text-[#e32d14]">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="con-desc" className="block text-[13px] font-medium mb-1">
              Details *
            </label>
            <textarea
              id="con-desc"
              rows={3}
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 5, message: 'At least 5 characters' },
              })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label htmlFor="con-hrs" className="block text-[13px] font-medium mb-1">
              Hours Spent
            </label>
            <input
              id="con-hrs"
              type="number"
              step="0.5"
              min="0"
              {...register('hoursSpent', { min: 0 })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </Modal>
    </WorkspaceLayout>
  );
};
