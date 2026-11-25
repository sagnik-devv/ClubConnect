import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Eye, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { presidentService } from '../../services/president.service';
import { recruitmentService } from '../../services/recruitment.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';
import { ApplicationStatus, RecruitmentApplication } from '../../types';

const STAGES: Array<{ key: ApplicationStatus; label: string }> = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
];

export const PresidentRecruitmentPage: React.FC = () => {
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [selectedApp, setSelectedApp] = useState<RecruitmentApplication | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['president-recruitment', selectedClubId],
    queryFn: () => presidentService.listRecruitment(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      presidentService.updateRecruitmentStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['president-recruitment', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success(`Application moved to ${updated.status.replace('_', ' ')}`);
      if (selectedApp?.id === updated.id) {
        setSelectedApp((prev) => (prev ? { ...prev, status: updated.status } : prev));
      }
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update application status'));
    },
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes: string }) =>
      recruitmentService.updateNotes(id, reviewNotes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['president-recruitment', selectedClubId] });
      toast.success('Internal review notes saved');
      if (selectedApp?.id === updated.id) {
        setSelectedApp((prev) => (prev ? { ...prev, reviewNotes: updated.reviewNotes } : prev));
      }
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to save review notes'));
    },
  });

  const stageCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      SHORTLISTED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
    };
    for (const app of applications) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }
    return counts;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = applications.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (a.user?.fullName || '').toLowerCase().includes(q) ||
        a.preferredRole.toLowerCase().includes(q) ||
        a.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.user?.fullName || '').localeCompare(b.user?.fullName || '');
      }
      const da = new Date(a.appliedAt).getTime();
      const db = new Date(b.appliedAt).getTime();
      return sortBy === 'oldest' ? da - db : db - da;
    });
  }, [applications, search, statusFilter, sortBy]);

  const badgeForStatus = (status: ApplicationStatus) => {
    if (status === 'ACCEPTED') return 'green';
    if (status === 'REJECTED') return 'coral';
    if (status === 'SHORTLISTED') return 'marigold';
    if (status === 'UNDER_REVIEW') return 'blue';
    return 'neutral';
  };

  return (
    <PresidentLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">
            {selectedClub?.name} · Recruitment Management
          </p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            Recruitment Pipeline
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Evaluate incoming student applications, save private leadership review notes, and onboard accepted candidates.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-[10px] bg-white border border-black/[0.08]">
          {(['pipeline', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-[7px] text-[13px] font-medium capitalize cursor-pointer ${
                viewMode === mode ? 'bg-[#0075de] text-white' : 'text-[#615d59] hover:text-black'
              }`}
            >
              {mode === 'pipeline' ? 'Pipeline' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Stage summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`notion-card p-3.5 text-left cursor-pointer ${
            statusFilter === 'ALL' ? 'border-[#0075de] bg-[#e6f3fe]/40' : ''
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#757575]">Total</div>
          <div className="mt-1 text-[22px] font-bold text-black">{applications.length}</div>
        </button>
        {STAGES.map((stage) => (
          <button
            key={stage.key}
            type="button"
            onClick={() => setStatusFilter(stage.key)}
            className={`notion-card p-3.5 text-left cursor-pointer ${
              statusFilter === stage.key ? 'border-[#0075de] bg-[#e6f3fe]/40' : ''
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#757575] truncate">
              {stage.label}
            </div>
            <div className="mt-1 text-[22px] font-bold text-black">{stageCounts[stage.key]}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="notion-card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#757575] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by applicant name, preferred role, or skill..."
            className="w-full h-10 pl-9 pr-3 rounded-[8px] border border-black/[0.1] bg-[#f6f5f4] text-[14px] focus:bg-white focus:outline-none focus:border-[#0075de]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ApplicationStatus)}
            className="h-10 px-3 rounded-[8px] border border-black/[0.1] bg-white text-[13px]"
          >
            <option value="ALL">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="h-10 px-3 rounded-[8px] border border-black/[0.1] bg-white text-[13px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Applicant Name</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No applications match"
          description="Incoming club applications will appear here as students apply to join your club."
        />
      ) : viewMode === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const items = filtered.filter((a) => a.status === stage.key);
            return (
              <div key={stage.key} className="notion-card p-4 bg-[#faf9f8] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-black">
                    {stage.label}
                  </span>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-white border border-black/[0.08]">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {items.length === 0 ? (
                    <div className="text-[12px] text-[#757575] py-4 text-center border border-dashed border-black/10 rounded-[8px]">
                      Empty stage
                    </div>
                  ) : (
                    items.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-[10px] bg-white border border-black/[0.08] space-y-2.5"
                      >
                        <div>
                          <div className="text-[14px] font-semibold text-black">
                            {app.user?.fullName || 'Applicant'}
                          </div>
                          <div className="text-[12px] text-[#0075de] font-medium">
                            {app.preferredRole}
                          </div>
                          {app.user?.department && (
                            <div className="text-[11px] text-[#757575] mt-0.5">
                              {app.user.department} {app.user.yearOfStudy ? `· ${app.user.yearOfStudy}` : ''}
                            </div>
                          )}
                        </div>
                        <p className="text-[12px] text-[#615d59] line-clamp-2">{app.motivation}</p>
                        <div className="flex flex-wrap gap-1">
                          {app.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#f6f5f4] text-[#615d59]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-black/[0.06]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setNotesDraft(app.reviewNotes || '');
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Button>
                          {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                            <select
                              aria-label={`Change stage for ${app.user?.fullName}`}
                              value={app.status}
                              onChange={(e) =>
                                statusMutation.mutate({
                                  id: app.id,
                                  status: e.target.value as ApplicationStatus,
                                })
                              }
                              className="h-7 px-1.5 rounded-[6px] border border-black/10 text-[11px] bg-[#faf9f8]"
                            >
                              {STAGES.map((st) => (
                                <option key={st.key} value={st.key}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="notion-card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.08] text-[12px] font-semibold uppercase tracking-wider text-[#757575] bg-[#faf9f8]">
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Preferred Role</th>
                <th className="py-3.5 px-4">Skills</th>
                <th className="py-3.5 px-4">Applied</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] text-[14px]">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-[#faf9f8]">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-black">{app.user?.fullName || 'Applicant'}</div>
                    <div className="text-[12px] text-[#757575]">
                      {app.user?.email} {app.user?.department ? `· ${app.user.department}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-black">{app.preferredRole}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {app.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="neutral">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#615d59] text-[13px]">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={badgeForStatus(app.status)}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setNotesDraft(app.reviewNotes || '');
                      }}
                    >
                      Open Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applicant Detail Modal */}
      <Modal
        open={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? `${selectedApp.user?.fullName || 'Applicant'} — Application` : 'Application'}
        maxWidthClass="max-w-2xl"
      >
        {selectedApp && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[10px] bg-[#faf9f8] border border-black/[0.08]">
              <div>
                <div className="text-[16px] font-bold text-black">{selectedApp.user?.fullName}</div>
                <div className="text-[13px] text-[#615d59]">
                  {selectedApp.user?.email} · {selectedApp.user?.department || 'Department N/A'}{' '}
                  {selectedApp.user?.yearOfStudy ? `· ${selectedApp.user.yearOfStudy}` : ''}
                </div>
              </div>
              <Badge variant={badgeForStatus(selectedApp.status)}>
                {selectedApp.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3.5 rounded-[10px] border border-black/[0.08]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#757575]">
                  Preferred Role
                </div>
                <div className="mt-1 font-semibold text-black">{selectedApp.preferredRole}</div>
              </div>
              <div className="p-3.5 rounded-[10px] border border-black/[0.08]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#757575]">
                  Submitted On
                </div>
                <div className="mt-1 font-semibold text-black">
                  {new Date(selectedApp.appliedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#757575] mb-1.5">
                Motivation
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#faf9f8] border border-black/[0.08] text-[14px] text-[#2f2d2a] whitespace-pre-wrap">
                {selectedApp.motivation}
              </div>
            </div>

            {selectedApp.experience && (
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[#757575] mb-1.5">
                  Relevant Experience
                </div>
                <div className="p-3.5 rounded-[10px] bg-[#faf9f8] border border-black/[0.08] text-[14px] text-[#2f2d2a] whitespace-pre-wrap">
                  {selectedApp.experience}
                </div>
              </div>
            )}

            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#757575] mb-1.5">
                Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.skills.map((skill) => (
                  <Badge key={skill} variant="peach">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Internal Review Notes */}
            <div className="pt-2 border-t border-black/[0.08]">
              <label className="text-[13px] font-semibold text-black flex items-center gap-1.5 mb-1.5">
                <FileText className="w-4 h-4 text-[#0075de]" />
                Internal Leadership Review Notes
              </label>
              <textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Private notes for club leadership (interview feedback, fit assessment)..."
                className="w-full p-3 rounded-[8px] border border-black/[0.12] text-[14px] focus:outline-none focus:border-[#0075de]"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={notesMutation.isPending}
                  onClick={() =>
                    notesMutation.mutate({ id: selectedApp.id, reviewNotes: notesDraft })
                  }
                >
                  {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>

            {/* Stage Transitions */}
            <div className="pt-3 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12px] font-medium text-[#757575] flex items-center gap-1">
                Move Pipeline Stage <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((stage) => (
                  <Button
                    key={stage.key}
                    variant={
                      stage.key === 'ACCEPTED'
                        ? 'primary'
                        : stage.key === 'REJECTED'
                          ? 'ghost'
                          : 'secondary'
                    }
                    size="sm"
                    disabled={
                      statusMutation.isPending || selectedApp.status === stage.key
                    }
                    onClick={() =>
                      statusMutation.mutate({ id: selectedApp.id, status: stage.key })
                    }
                  >
                    {stage.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PresidentLayout>
  );
};
