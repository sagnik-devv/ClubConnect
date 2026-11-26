import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Edit3, Plus, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { clubService } from '../services/club.service';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { getApiErrorMessage } from '../services/api';

interface EditClubValues {
  shortDescription: string;
  expectedTimeCommitment: string;
  isRecruiting: boolean;
}

export const ManagementDashboardPage: React.FC = () => {
  const { leaderMemberships } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClubId, setSelectedClubId] = useState<string>(
    leaderMemberships[0]?.clubId || ''
  );
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editClubOpen, setEditClubOpen] = useState(false);

  const activeClubId = selectedClubId || leaderMemberships[0]?.clubId || '';

  const {
    data: club,
    isLoading: clubLoading,
  } = useQuery({
    queryKey: ['club', activeClubId],
    queryFn: () => clubService.getClub(activeClubId),
    enabled: Boolean(activeClubId),
  });

  const {
    data: stats,
    isLoading: statsLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['club-stats', activeClubId],
    queryFn: () => clubService.getStatistics(activeClubId),
    enabled: Boolean(activeClubId),
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['membership-requests', activeClubId],
    queryFn: () => clubService.listMembershipRequests(activeClubId),
    enabled: Boolean(activeClubId),
  });

  const reviewMembershipMutation = useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: string;
      status: 'ACTIVE' | 'REJECTED';
    }) => clubService.reviewMembershipRequest(activeClubId, requestId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-requests', activeClubId] });
      queryClient.invalidateQueries({ queryKey: ['club-stats', activeClubId] });
      toast.success('Membership request updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update request'));
    },
  });

  const editClubForm = useForm<EditClubValues>({
    values: club
      ? {
          shortDescription: club.shortDescription,
          expectedTimeCommitment: club.expectedTimeCommitment || '',
          isRecruiting: club.isRecruiting,
        }
      : undefined,
  });

  const editClubMutation = useMutation({
    mutationFn: (values: EditClubValues) => clubService.updateClub(activeClubId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', activeClubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Club details updated');
      setEditClubOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update club'));
    },
  });

  if (leaderMemberships.length === 0) {
    return (
      <WorkspaceLayout>
        <EmptyState
          title="No club leadership roles yet"
          description="You can manage clubs where you hold a President, Vice President, Secretary, Treasurer, or Coordinator role—or create a new club."
          action={
            <Button variant="primary" to="/clubs">
              Discover or Create a Club
            </Button>
          }
        />
      </WorkspaceLayout>
    );
  }

  if (statsLoading || clubLoading) {
    return (
      <WorkspaceLayout>
        <PageSkeleton />
      </WorkspaceLayout>
    );
  }

  if (isError || !stats || !club) {
    return (
      <WorkspaceLayout>
        <ErrorState
          message={getApiErrorMessage(error, 'Could not load club management analytics')}
          onRetry={() => refetch()}
        />
      </WorkspaceLayout>
    );
  }

  const { summary, memberRoster, workloadDistribution, leaderboard } = stats;
  const overloaded = memberRoster.filter((m) => m.assignedTasks >= 3);

  return (
    <WorkspaceLayout>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">Club Management Dashboard</p>
          <h1 className="mt-1 text-[32px] sm:text-[40px] font-bold text-black tracking-[-0.03em] leading-tight">
            {club.name}
          </h1>
          <p className="mt-1.5 text-[15px] text-[#615d59]">{club.shortDescription}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select managed club"
            value={activeClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px] font-medium"
          >
            {leaderMemberships.map((m) => (
              <option key={m.clubId} value={m.clubId}>
                {m.club.name} ({m.role})
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => setEditClubOpen(true)}>
            <Edit3 className="w-4 h-4" />
            Edit Club
          </Button>
          <Button variant="primary" onClick={() => setTaskModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Assign Task
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Active Members</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.totalActiveMembers} />
          </div>
          <div className="mt-2 text-[12px] text-[#615d59]">
            {summary.participationRate}% active participation rate
          </div>
        </div>

        <div className="notion-card p-5 bg-[#e6f3fe] border-[#0075de]/15">
          <div className="text-[13px] text-[#0075de] font-medium">Active Tasks</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.activeTasks} />
          </div>
          <div className="mt-2 text-[12px] text-[#615d59]">
            {summary.completedTasks} completed · {summary.overdueTasks} overdue
          </div>
        </div>

        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Pending Verifications</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.pendingContributions} />
          </div>
          <div className="mt-2 text-[12px] text-[#0075de]">
            <a href="/contributions" className="hover:underline">Review contributions</a>
          </div>
        </div>

        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Recruitment & Events</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.pendingRecruitmentApplications} />
          </div>
          <div className="mt-2 text-[12px] text-[#615d59]">
            open apps · {summary.upcomingEvents} upcoming events
          </div>
        </div>
      </div>

      {overloaded.length > 0 && (
        <div className="mt-6 p-4 rounded-[12px] bg-[#ffb110]/20 border border-[#ffb110]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-black shrink-0 mt-0.5" />
            <div className="text-[14px] text-black">
              <strong>Uneven workload spotted:</strong>{' '}
              {overloaded.map((m) => m.user.fullName).join(', ')} currently hold 3+ active tasks.
            </div>
          </div>
          <Button variant="outline" size="sm" to="/tasks" className="bg-white">
            Rebalance on Board
          </Button>
        </div>
      )}

      {/* Pending Direct Membership Requests */}
      {pendingRequests.length > 0 && (
        <section className="mt-8 notion-card p-6">
          <h2 className="card-heading font-bold text-black mb-4">
            Pending Membership Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-black">{req.user.fullName}</div>
                  <div className="text-[12px] text-[#615d59]">
                    {req.user.department || ''} {req.user.yearOfStudy ? `· ${req.user.yearOfStudy}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      reviewMembershipMutation.mutate({ requestId: req.id, status: 'ACTIVE' })
                    }
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      reviewMembershipMutation.mutate({ requestId: req.id, status: 'REJECTED' })
                    }
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Workload & Leaderboard */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="notion-card p-6">
          <h2 className="card-heading font-bold text-black">Workload Distribution</h2>
          <p className="text-[13px] text-[#615d59] mb-4">
            Active tasks assigned per club member.
          </p>
          {workloadDistribution.length === 0 ? (
            <p className="text-[14px] text-[#615d59]">No members or tasks to chart yet.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="activeTasks" name="Active Tasks" radius={[4, 4, 0, 0]}>
                    {workloadDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.activeTasks >= 3 ? '#f64932' : '#0075de'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="notion-card p-6">
          <h2 className="card-heading font-bold text-black">Verified Contribution Leaderboard</h2>
          <p className="text-[13px] text-[#615d59] mb-4">
            Based exclusively on leader-verified contributions in {club.name}.
          </p>
          {leaderboard.every((l) => l.totalPoints === 0) ? (
            <p className="text-[14px] text-[#615d59]">
              No verified contributions recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((row, idx) => (
                <div
                  key={row.user.id}
                  className="p-3 rounded-[8px] bg-[#f6f5f4] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-black/10 text-[12px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[14px] text-black">
                      {row.user.fullName}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#615d59]">
                    <strong className="text-black">{row.totalPoints} pts</strong> · {row.totalHours}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Member Table */}
      <section className="mt-8 notion-card overflow-hidden">
        <div className="p-6 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="card-heading font-bold text-black">Member Roster</h2>
            <p className="text-[13px] text-[#615d59]">
              Actual task loads and verified contribution counts per active member.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" to="/events">
              Manage Events
            </Button>
            <Button variant="outline" size="sm" to="/recruitment">
              Review Applications
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#faf9f8] text-[12px] font-semibold uppercase tracking-wider text-[#757575]">
                <th className="py-3.5 px-6">Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Assigned</th>
                <th className="py-3.5 px-4">Completed</th>
                <th className="py-3.5 px-4">Verified Contribs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] text-[14px]">
              {memberRoster.map((m) => {
                const initials = m.user.fullName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <tr key={m.membershipId} className="hover:bg-[#f6f5f4]/60">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={initials}
                          profileImage={m.user.profileImage}
                          seed={m.user.id}
                          color="#0075de"
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-black">{m.user.fullName}</div>
                          <div className="text-[12px] text-[#757575]">
                            {m.user.yearOfStudy || m.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="blue">{m.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {m.assignedTasks}{' '}
                      {m.assignedTasks >= 3 && <Badge variant="coral">High</Badge>}
                    </td>
                    <td className="py-3.5 px-4">{m.completedTasks}</td>
                    <td className="py-3.5 px-4 text-[#615d59]">
                      {m.verifiedContributions} ({m.totalPoints} pts)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <CreateTaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        defaultClubId={activeClubId}
      />

      <Modal
        open={editClubOpen}
        onClose={() => setEditClubOpen(false)}
        title={`Edit ${club.name}`}
        subtitle="Update public club summary, commitment, and recruitment availability."
      >
        <form
          onSubmit={editClubForm.handleSubmit((vals) => editClubMutation.mutate(vals))}
          className="space-y-4"
        >
          <div>
            <label htmlFor="mc-short" className="block text-[13px] font-medium mb-1">
              Short Description
            </label>
            <textarea
              id="mc-short"
              rows={2}
              {...editClubForm.register('shortDescription', { required: true })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>
          <div>
            <label htmlFor="mc-time" className="block text-[13px] font-medium mb-1">
              Expected Time Commitment
            </label>
            <input
              id="mc-time"
              type="text"
              {...editClubForm.register('expectedTimeCommitment')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-[14px] font-medium cursor-pointer">
            <input
              type="checkbox"
              {...editClubForm.register('isRecruiting')}
              className="accent-[#0075de]"
            />
            Currently recruiting new members
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditClubOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editClubMutation.isPending}>
              {editClubMutation.isPending ? 'Saving...' : 'Save Updates'}
            </Button>
          </div>
        </form>
      </Modal>
    </WorkspaceLayout>
  );
};
