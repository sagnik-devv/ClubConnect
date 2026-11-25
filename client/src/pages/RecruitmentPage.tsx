import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessageSquare, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { recruitmentService } from '../services/recruitment.service';
import { ONBOARDING_STEPS } from '../utils/onboardingSteps';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { getApiErrorMessage } from '../services/api';
import { ApplicationStatus, RecruitmentApplication } from '../types';

export const RecruitmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMyAppId, setSelectedMyAppId] = useState<string>('');
  const [notesModalApp, setNotesModalApp] = useState<RecruitmentApplication | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recruitment'],
    queryFn: recruitmentService.getOverview,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      recruitmentService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      queryClient.invalidateQueries({ queryKey: ['club-stats'] });
      toast.success('Application status updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update application status'));
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: ({ id, step }: { id: string; step: number }) =>
      recruitmentService.updateOnboarding(id, step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      toast.success('Onboarding progress updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update onboarding step'));
    },
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      recruitmentService.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      toast.success('Review notes saved');
      setNotesModalApp(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not save notes'));
    },
  });

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <PageSkeleton />
      </WorkspaceLayout>
    );
  }

  if (isError || !data) {
    return (
      <WorkspaceLayout>
        <ErrorState
          message={getApiErrorMessage(error, 'Could not load recruitment data')}
          onRetry={() => refetch()}
        />
      </WorkspaceLayout>
    );
  }

  const { myApplications, manageableApplications } = data;
  const activeMyApp =
    myApplications.find((a) => a.id === selectedMyAppId) || myApplications[0] || null;

  const statusBadge = (status: ApplicationStatus) => {
    if (status === 'ACCEPTED') return 'green';
    if (status === 'SHORTLISTED') return 'blue';
    if (status === 'UNDER_REVIEW') return 'marigold';
    if (status === 'REJECTED') return 'coral';
    return 'peach';
  };

  return (
    <WorkspaceLayout>
      <div>
        <p className="text-[13px] font-medium text-[#757575]">Recruitment & Onboarding</p>
        <h1 className="mt-1 text-[32px] sm:text-[42px] font-bold text-black tracking-[-0.035em] leading-tight">
          Transparent applications & guided onboarding.
        </h1>
      </div>

      {/* My Applications + Onboarding */}
      <section className="mt-8 space-y-6">
        {myApplications.length === 0 ? (
          <EmptyState
            title="No applications submitted yet"
            description="Browse open clubs and submit an application to track your progress here."
            action={
              <Button variant="primary" size="sm" to="/clubs">
                Discover Clubs
              </Button>
            }
          />
        ) : (
          activeMyApp && (
            <div className="notion-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-black/[0.08]">
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#0075de]">
                    <UserCheck className="w-4 h-4" />
                    Your Application & Onboarding Journey
                  </div>
                  <h2 className="mt-1 text-[20px] font-bold text-black">
                    {activeMyApp.club.name} · {activeMyApp.preferredRole}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {myApplications.length > 1 && (
                    <select
                      aria-label="Select application"
                      value={activeMyApp.id}
                      onChange={(e) => setSelectedMyAppId(e.target.value)}
                      className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[13px]"
                    >
                      {myApplications.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.club.name} — {a.preferredRole}
                        </option>
                      ))}
                    </select>
                  )}
                  <Badge variant={statusBadge(activeMyApp.status)}>{activeMyApp.status}</Badge>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="font-medium text-black">
                    Step {activeMyApp.onboardingStep} of 6
                  </span>
                  <span className="text-[#615d59]">
                    {Math.round((activeMyApp.onboardingStep / 6) * 100)}% complete
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#f6f5f4] overflow-hidden">
                  <div
                    style={{ width: `${(activeMyApp.onboardingStep / 6) * 100}%` }}
                    className="h-full bg-[#0075de] rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ONBOARDING_STEPS.map((st) => {
                  const completed = st.step <= activeMyApp.onboardingStep;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() =>
                        onboardingMutation.mutate({ id: activeMyApp.id, step: st.step })
                      }
                      className={`text-left p-4 rounded-[10px] border transition-all cursor-pointer ${
                        completed
                          ? 'bg-[#e6f3fe]/70 border-[#0075de]/25'
                          : 'bg-[#faf9f8] border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#615d59]">
                          Step {st.step}
                        </span>
                        {completed && <CheckCircle2 className="w-4 h-4 text-[#0075de]" />}
                      </div>
                      <div className="mt-1.5 text-[15px] font-bold text-black">{st.title}</div>
                      <p className="mt-1 text-[13px] text-[#615d59]">{st.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}
      </section>

      {/* Leader Review Queue */}
      {manageableApplications.length > 0 && (
        <section className="mt-8 notion-card overflow-hidden">
          <div className="p-6 border-b border-black/[0.08]">
            <h2 className="card-heading font-bold text-black">
              Applications to Review ({manageableApplications.length})
            </h2>
            <p className="text-[13px] text-[#615d59]">
              Accepting an applicant automatically creates their active membership in PostgreSQL.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] bg-[#faf9f8] text-[12px] font-semibold uppercase tracking-wider text-[#757575]">
                  <th className="py-3 px-5">Candidate</th>
                  <th className="py-3 px-4">Club & Role</th>
                  <th className="py-3 px-4">Motivation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-[14px]">
                {manageableApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f6f5f4]/60">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-black">{app.user?.fullName}</div>
                      <div className="text-[12px] text-[#757575]">
                        {app.user?.department} {app.user?.yearOfStudy ? `· ${app.user.yearOfStudy}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-black">{app.club.name}</div>
                      <div className="text-[12px] text-[#615d59]">{app.preferredRole}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-[13px] text-[#615d59] truncate">
                      {app.motivation}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Status for ${app.user?.fullName}`}
                        value={app.status}
                        onChange={(e) =>
                          statusMutation.mutate({
                            id: app.id,
                            status: e.target.value as ApplicationStatus,
                          })
                        }
                        className="px-2.5 py-1 rounded-[6px] border border-black/15 bg-white text-[12px] font-medium"
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setNotesModalApp(app);
                          setNotesDraft(app.reviewNotes || '');
                        }}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0075de] hover:underline cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {app.reviewNotes ? 'Edit Note' : 'Add Note'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(notesModalApp)}
        onClose={() => setNotesModalApp(null)}
        title="Internal Review Notes"
        subtitle={
          notesModalApp
            ? `${notesModalApp.user?.fullName} — ${notesModalApp.club.name}`
            : ''
        }
      >
        <div className="space-y-4">
          <textarea
            rows={4}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Record interview impressions or onboarding buddy assignment..."
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNotesModalApp(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={notesMutation.isPending}
              onClick={() =>
                notesModalApp &&
                notesMutation.mutate({ id: notesModalApp.id, notes: notesDraft })
              }
            >
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </WorkspaceLayout>
  );
};
