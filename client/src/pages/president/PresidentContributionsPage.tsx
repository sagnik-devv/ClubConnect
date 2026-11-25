import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { useAuth } from '../../context/AuthContext';
import { presidentService } from '../../services/president.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';
import { ContributionItem } from '../../types';

export const PresidentContributionsPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  const [reviewItem, setReviewItem] = useState<ContributionItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [customPoints, setCustomPoints] = useState<string>('');

  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-contributions', selectedClubId],
    queryFn: () => presidentService.listContributions(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      status,
      points,
      note,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED';
      points?: number;
      note?: string;
    }) => presidentService.verifyContribution(id, { status, points, reviewNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-contributions', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success('Contribution review recorded');
      setReviewItem(null);
      setReviewNote('');
      setCustomPoints('');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not verify contribution'));
    },
  });

  const filtered = tab === 'ALL' ? items : items.filter((i) => i.status === tab);

  return (
    <PresidentLayout>
      <div>
        <p className="text-[13px] font-medium text-[#757575]">
          {selectedClub?.name} · Contribution Verification Centre
        </p>
        <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
          Verify Contributions
        </h1>
        <p className="mt-1 text-[15px] text-[#615d59]">
          Review member submissions, award points, and keep contribution analytics accurate. Presidents cannot verify their own submissions.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium cursor-pointer ${
              tab === t
                ? 'bg-[#0075de] text-white'
                : 'bg-white border border-black/10 text-[#615d59]'
            }`}
          >
            {t} ({t === 'ALL' ? items.length : items.filter((i) => i.status === t).length})
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load contributions')}
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${tab.toLowerCase()} contributions`}
            description="Submissions from club members will appear here."
          />
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-[#faf9f8] text-[12px] font-semibold uppercase tracking-wider text-[#757575]">
                    <th className="py-3 px-5">Member</th>
                    <th className="py-3 px-4">Contribution Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Related Task</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] text-[13px]">
                  {filtered.map((item) => {
                    const isSelf = item.userId === user?.id;
                    return (
                      <tr key={item.id} className="hover:bg-[#f6f5f4]/60">
                        <td className="py-3.5 px-5 font-semibold text-black">
                          {item.user.fullName}
                        </td>
                        <td className="py-3.5 px-4">{item.title}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="peach">{item.contributionType}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-[#615d59]">
                          {item.task?.title || '—'}
                        </td>
                        <td className="py-3.5 px-4">{item.hoursSpent}h</td>
                        <td className="py-3.5 px-4 text-[#757575]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              item.status === 'VERIFIED'
                                ? 'green'
                                : item.status === 'REJECTED'
                                ? 'coral'
                                : 'marigold'
                            }
                          >
                            {item.status}
                            {item.status === 'VERIFIED' ? ` (+${item.points})` : ''}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewItem(item);
                                setReviewNote(item.reviewNote || '');
                                setCustomPoints('');
                              }}
                              className="inline-flex items-center gap-1 text-[#0075de] hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review
                            </button>
                            {item.status === 'PENDING' && !isSelf && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    verifyMutation.mutate({ id: item.id, status: 'VERIFIED' })
                                  }
                                  className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                  title="Quick Verify"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    verifyMutation.mutate({
                                      id: item.id,
                                      status: 'REJECTED',
                                      note: 'Needs clarification',
                                    })
                                  }
                                  className="p-1.5 rounded bg-[#f64932]/10 text-[#c72914] hover:bg-[#f64932]/20 cursor-pointer"
                                  title="Reject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
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

      <Modal
        open={Boolean(reviewItem)}
        onClose={() => setReviewItem(null)}
        title={reviewItem?.title || 'Contribution Details'}
        subtitle={
          reviewItem
            ? `Submitted by ${reviewItem.user.fullName} · ${reviewItem.contributionType} · ${reviewItem.hoursSpent}h`
            : ''
        }
      >
        {reviewItem && (
          <div className="space-y-4 text-[14px]">
            <p className="text-[#615d59]">{reviewItem.description}</p>
            {reviewItem.status === 'PENDING' && reviewItem.userId !== user?.id ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">
                      Points Override (optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      placeholder="Uses club default if blank"
                      value={customPoints}
                      onChange={(e) => setCustomPoints(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1">
                    Review Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={verifyMutation.isPending}
                    onClick={() =>
                      verifyMutation.mutate({
                        id: reviewItem.id,
                        status: 'REJECTED',
                        note: reviewNote.trim() || 'Rejected by leadership',
                      })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    disabled={verifyMutation.isPending}
                    onClick={() =>
                      verifyMutation.mutate({
                        id: reviewItem.id,
                        status: 'VERIFIED',
                        points: customPoints ? Number(customPoints) : undefined,
                        note: reviewNote.trim() || undefined,
                      })
                    }
                  >
                    Verify & Award Points
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-[8px] bg-[#f6f5f4] text-[13px]">
                {reviewItem.userId === user?.id && reviewItem.status === 'PENDING'
                  ? 'You cannot verify your own contribution. Another club leader must review it.'
                  : `Status: ${reviewItem.status} (${reviewItem.points} pts)`}
              </div>
            )}
          </div>
        )}
      </Modal>
    </PresidentLayout>
  );
};
