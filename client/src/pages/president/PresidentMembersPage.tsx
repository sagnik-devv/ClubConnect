import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Search, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { useAuth } from '../../context/AuthContext';
import { PresidentMemberRow, presidentService } from '../../services/president.service';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';
import { ClubRole } from '../../types';

const ROLES: ClubRole[] = [
  'MEMBER',
  'COORDINATOR',
  'TREASURER',
  'SECRETARY',
  'VICE_PRESIDENT',
  'PRESIDENT',
];

export const PresidentMembersPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [sortBy, setSortBy] = useState('joinedAt');
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PresidentMemberRow | null>(null);

  const { data: members = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-members', selectedClubId, { search, roleFilter, statusFilter, sortBy }],
    queryFn: () =>
      presidentService.listMembers(selectedClubId, {
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        sort: sortBy,
      }),
    enabled: Boolean(selectedClubId),
  });

  const { data: memberDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['president-member-detail', selectedClubId, detailMemberId],
    queryFn: () => presidentService.getMemberDetail(selectedClubId, detailMemberId!),
    enabled: Boolean(selectedClubId && detailMemberId),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
      status,
    }: {
      memberId: string;
      role?: ClubRole;
      status?: 'ACTIVE' | 'REMOVED';
    }) => presidentService.updateMember(selectedClubId, memberId, { role, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-members', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success('Member updated');
      setConfirmRemove(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update member'));
    },
  });

  return (
    <PresidentLayout>
      <div>
        <p className="text-[13px] font-medium text-[#757575]">
          {selectedClub?.name} · Member Management
        </p>
        <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
          Club Members
        </h1>
        <p className="mt-1 text-[15px] text-[#615d59]">
          Search roster, inspect member activity, update club roles, or remove inactive memberships.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 notion-card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#757575] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-10 pr-4 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[13px]"
          >
            <option value="ALL">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[13px]"
          >
            <option value="ACTIVE">Active</option>
            <option value="ALL">All Statuses</option>
            <option value="LEFT">Left</option>
            <option value="REMOVED">Removed</option>
          </select>
          <select
            aria-label="Sort members"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[13px]"
          >
            <option value="joinedAt">Sort: Join Date</option>
            <option value="points">Sort: Contribution Points</option>
            <option value="completedTasks">Sort: Completed Tasks</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load club members')}
            onRetry={() => refetch()}
          />
        ) : members.length === 0 ? (
          <EmptyState
            title="No members match these filters"
            description="Adjust your search or status filter to see club members."
          />
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-[#faf9f8] text-[12px] font-semibold uppercase tracking-wider text-[#757575]">
                    <th className="py-3 px-5">Member</th>
                    <th className="py-3 px-4">Dept & Year</th>
                    <th className="py-3 px-4">Club Role</th>
                    <th className="py-3 px-4">Tasks (Act/Done)</th>
                    <th className="py-3 px-4">Verified Contribs</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] text-[13px]">
                  {members.map((m) => {
                    const initials = m.user.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    const isSelf = m.userId === user?.id;

                    return (
                      <tr key={m.id} className="hover:bg-[#f6f5f4]/60">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              initials={initials}
                              profileImage={m.user.profileImage}
                              seed={m.user.id}
                              color="#0075de"
                              size="sm"
                            />
                            <div>
                              <div className="font-semibold text-black">{m.user.fullName}</div>
                              <div className="text-[12px] text-[#757575]">{m.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#615d59]">
                          <div>{m.user.department || '—'}</div>
                          <div className="text-[12px]">{m.user.yearOfStudy || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            aria-label={`Role for ${m.user.fullName}`}
                            disabled={isSelf || m.status !== 'ACTIVE'}
                            value={m.role}
                            onChange={(e) =>
                              updateMutation.mutate({
                                memberId: m.id,
                                role: e.target.value as ClubRole,
                              })
                            }
                            className="px-2 py-1 rounded-[6px] border border-black/15 bg-white text-[12px] font-medium disabled:opacity-60"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <strong>{m.assignedTasks}</strong> / {m.completedTasks}
                        </td>
                        <td className="py-3.5 px-4 text-[#615d59]">
                          {m.verifiedContributions} ({m.totalPoints} pts)
                        </td>
                        <td className="py-3.5 px-4 text-[#757575]">
                          {new Date(m.lastActivity).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={m.status === 'ACTIVE' ? 'green' : 'neutral'}>
                            {m.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailMemberId(m.id)}
                              className="p-1.5 rounded-[6px] text-[#0075de] hover:bg-[#e6f3fe] cursor-pointer"
                              title="View member details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!isSelf && m.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => setConfirmRemove(m)}
                                className="p-1.5 rounded-[6px] text-[#e32d14] hover:bg-[#f64932]/10 cursor-pointer"
                                title="Remove member"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      <Modal
        open={Boolean(detailMemberId)}
        onClose={() => setDetailMemberId(null)}
        title={memberDetail?.membership.user.fullName || 'Member Details'}
        subtitle={
          memberDetail
            ? `${memberDetail.membership.role} · ${memberDetail.membership.user.email}`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {detailLoading || !memberDetail ? (
          <PageSkeleton />
        ) : (
          <div className="space-y-5 text-[14px]">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-[8px] bg-[#f6f5f4]">
                <div className="text-[12px] text-[#615d59]">Verified Points</div>
                <div className="text-[20px] font-bold text-black">{memberDetail.verifiedPoints}</div>
              </div>
              <div className="p-3 rounded-[8px] bg-[#f6f5f4]">
                <div className="text-[12px] text-[#615d59]">Tasks Completed</div>
                <div className="text-[20px] font-bold text-black">
                  {memberDetail.completedTasks.length}
                </div>
              </div>
              <div className="p-3 rounded-[8px] bg-[#f6f5f4]">
                <div className="text-[12px] text-[#615d59]">Events Attended</div>
                <div className="text-[20px] font-bold text-black">
                  {memberDetail.eventsAttended.length}
                </div>
              </div>
            </div>

            {memberDetail.membership.user.bio && (
              <div>
                <h3 className="font-semibold text-black mb-1">Bio</h3>
                <p className="text-[#615d59]">{memberDetail.membership.user.bio}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-black mb-2">
                Assigned Tasks ({memberDetail.assignedTasks.length})
              </h3>
              {memberDetail.assignedTasks.length === 0 ? (
                <p className="text-[13px] text-[#615d59]">No active tasks assigned.</p>
              ) : (
                <div className="space-y-1.5">
                  {memberDetail.assignedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-[8px] bg-[#faf9f8] border border-black/[0.06] flex justify-between"
                    >
                      <span className="font-medium">{t.title}</span>
                      <Badge variant="blue">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">
                Contribution History ({memberDetail.contributions.length})
              </h3>
              {memberDetail.contributions.length === 0 ? (
                <p className="text-[13px] text-[#615d59]">No contributions in this club yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {memberDetail.contributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-[8px] bg-[#faf9f8] border border-black/[0.06] flex justify-between"
                    >
                      <span>{c.title}</span>
                      <Badge variant={c.status === 'VERIFIED' ? 'green' : 'neutral'}>
                        {c.status} ({c.points} pts)
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Removal */}
      <Modal
        open={Boolean(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        title="Remove Club Member"
        subtitle={`Remove ${confirmRemove?.user.fullName} from ${selectedClub?.name}? Historical tasks and contributions will be preserved.`}
        maxWidthClass="max-w-md"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={updateMutation.isPending}
            onClick={() =>
              confirmRemove &&
              updateMutation.mutate({ memberId: confirmRemove.id, status: 'REMOVED' })
            }
          >
            Confirm Removal
          </Button>
        </div>
      </Modal>
    </PresidentLayout>
  );
};
