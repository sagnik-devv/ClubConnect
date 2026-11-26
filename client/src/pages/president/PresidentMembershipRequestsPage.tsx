import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { presidentService } from '../../services/president.service';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';

export const PresidentMembershipRequestsPage: React.FC = () => {
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingReq, setViewingReq] = useState<{
    id: string;
    joinedAt: string;
    user: {
      fullName: string;
      email: string;
      department: string | null;
      yearOfStudy: string | null;
      skills: string[];
      interests: string[];
      bio: string | null;
    };
  } | null>(null);

  const { data: requests = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-membership-requests', selectedClubId],
    queryFn: () => presidentService.listMembershipRequests(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      requestId,
      status,
      reason,
    }: {
      requestId: string;
      status: 'ACTIVE' | 'REJECTED';
      reason?: string;
    }) => presidentService.reviewMembershipRequest(selectedClubId, requestId, { status, reason }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['president-membership-requests', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-members', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success(
        vars.status === 'ACTIVE'
          ? 'Member approved and added to club!'
          : 'Membership request rejected'
      );
      setRejectTargetId(null);
      setRejectReason('');
      setViewingReq(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not process request'));
    },
  });

  return (
    <PresidentLayout>
      <div>
        <p className="text-[13px] font-medium text-[#757575]">
          {selectedClub?.name} · Membership Requests
        </p>
        <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
          Pending Membership Requests
        </h1>
        <p className="mt-1 text-[15px] text-[#615d59]">
          Review direct join requests. Approving activates membership and notifies the student.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load membership requests')}
            onRetry={() => refetch()}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No pending membership requests"
            description="When students request to join this club directly, they will appear here for review."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {requests.map((req) => {
              const initials = req.user.fullName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <article key={req.id} className="notion-card p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={initials}
                        profileImage={req.user.profileImage}
                        seed={req.user.id}
                        color="#0075de"
                        size="md"
                      />
                      <div>
                        <h2 className="text-[17px] font-bold text-black">{req.user.fullName}</h2>
                        <div className="text-[12px] text-[#615d59]">
                          {req.user.department || 'Department N/A'} ·{' '}
                          {req.user.yearOfStudy || 'Year N/A'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="marigold">{req.status}</Badge>
                  </div>

                  {req.user.bio && (
                    <p className="text-[14px] text-[#615d59] line-clamp-2">{req.user.bio}</p>
                  )}

                  {(req.user.skills.length > 0 || req.user.interests.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {req.user.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-full bg-[#e6f3fe] text-[#0075de] text-[12px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {req.user.interests.slice(0, 3).map((i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full bg-[#f6f5f4] text-[#615d59] text-[12px]"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12px] text-[#757575]">
                      Requested {new Date(req.joinedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setViewingReq(req)}>
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={decisionMutation.isPending}
                        onClick={() =>
                          decisionMutation.mutate({ requestId: req.id, status: 'ACTIVE' })
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={decisionMutation.isPending}
                        onClick={() => setRejectTargetId(req.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        open={Boolean(viewingReq)}
        onClose={() => setViewingReq(null)}
        title={viewingReq?.user.fullName || 'Applicant Profile'}
        subtitle={viewingReq?.user.email}
      >
        {viewingReq && (
          <div className="space-y-4 text-[14px]">
            <div className="p-3.5 rounded-[8px] bg-[#f6f5f4] space-y-1">
              <div><strong>Department:</strong> {viewingReq.user.department || 'Not specified'}</div>
              <div><strong>Year of Study:</strong> {viewingReq.user.yearOfStudy || 'Not specified'}</div>
              <div><strong>Requested:</strong> {new Date(viewingReq.joinedAt).toLocaleString()}</div>
            </div>
            {viewingReq.user.bio && (
              <div>
                <strong>Bio / Motivation:</strong>
                <p className="mt-1 text-[#615d59]">{viewingReq.user.bio}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectTargetId(viewingReq.id);
                  setViewingReq(null);
                }}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  decisionMutation.mutate({ requestId: viewingReq.id, status: 'ACTIVE' })
                }
              >
                Approve Membership
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        open={Boolean(rejectTargetId)}
        onClose={() => setRejectTargetId(null)}
        title="Reject Membership Request"
        subtitle="Optionally share a constructive note with the student."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Optional reason..."
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={decisionMutation.isPending}
              onClick={() =>
                rejectTargetId &&
                decisionMutation.mutate({
                  requestId: rejectTargetId,
                  status: 'REJECTED',
                  reason: rejectReason.trim() || undefined,
                })
              }
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </PresidentLayout>
  );
};
