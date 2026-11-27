import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  LogOut,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../layouts/MainLayout';
import { ClubLogoMark } from '../components/common/CharacterMarks';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { JoinClubModal } from '../components/clubs/JoinClubModal';
import { ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { clubService } from '../services/club.service';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';

export const ClubDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, refreshSession } = useAuth();
  const [joinOpen, setJoinOpen] = useState(false);

  const {
    data: club,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['club', id],
    queryFn: () => clubService.getClub(id!),
    enabled: Boolean(id),
  });

  const leaveMutation = useMutation({
    mutationFn: () => clubService.leaveClub(club!.id),
    onSuccess: async () => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      toast.success(`Left ${club?.name}`);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not leave club'));
    },
  });

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.info('Sign in to apply to this club');
      navigate('/login');
      return;
    }
    setJoinOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <PageSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (isError || !club) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
          <ErrorState
            message={getApiErrorMessage(error, 'Club could not be loaded')}
            onRetry={() => refetch()}
          />
          <div className="mt-6 text-center">
            <Button variant="secondary" to="/clubs">
              Back to Discover Clubs
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isActiveMember = club.userMembership?.status === 'ACTIVE';
  const isLeader =
    club.userMembership?.status === 'ACTIVE' &&
    ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'COORDINATOR'].includes(
      club.userMembership.role
    );

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <Link
          to="/clubs"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#615d59] hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all clubs
        </Link>

        {/* Cover Banner */}
        <section
          style={{ backgroundColor: club.accentColor || '#e6f3fe' }}
          className="rounded-[12px] border border-black/[0.08] p-6 sm:p-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <ClubLogoMark
                clubId={club.slug}
                logo={club.logo}
                accentColor="#ffffff"
                size={64}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{club.category}</Badge>
                  <Badge variant={club.isRecruiting ? 'blue' : 'neutral'}>
                    {club.isRecruiting ? 'Recruiting' : 'Recruitment Closed'}
                  </Badge>
                  {isActiveMember && <Badge variant="green">{club.userMembership?.role}</Badge>}
                </div>
                <h1 className="mt-3 text-[34px] sm:text-[46px] font-bold tracking-[-0.03em] leading-[1.08] text-black">
                  {club.name}
                </h1>
                <p className="mt-2 text-[17px] max-w-2xl font-editorial text-black/80">
                  {club.shortDescription}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!isActiveMember && club.isRecruiting && (
                <Button variant="primary" size="lg" onClick={handleApplyClick}>
                  Apply to Join
                </Button>
              )}
              {isLeader && (
                <Button variant="primary" size="lg" to="/manage">
                  Manage Club
                </Button>
              )}
              {isActiveMember && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                >
                  <LogOut className="w-4 h-4" />
                  Leave Club
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Transparency Snapshot */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="notion-card p-5">
            <div className="text-[12px] text-[#757575] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0075de]" />
              Expected Time Commitment
            </div>
            <div className="mt-1.5 text-[18px] font-bold text-black">
              {club.expectedTimeCommitment || 'Not specified'}
            </div>
          </div>
          <div className="notion-card p-5">
            <div className="text-[12px] text-[#757575] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0075de]" />
              Meeting Schedule
            </div>
            <div className="mt-1.5 text-[15px] font-semibold text-black">
              {club.meetingSchedule || 'TBD'}
            </div>
          </div>
          <div className="notion-card p-5">
            <div className="text-[12px] text-[#757575] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0075de]" />
              Active Members
            </div>
            <div className="mt-1.5 text-[20px] font-bold text-black">{club.memberCount}</div>
          </div>
          <div className="notion-card p-5">
            <div className="text-[12px] text-[#757575] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0075de]" />
              Location
            </div>
            <div className="mt-1.5 text-[15px] font-semibold text-black">
              {club.location || 'Campus'}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <section className="notion-card p-6 space-y-5">
              <div>
                <h2 className="card-heading font-bold text-black">Club Overview</h2>
                <p className="mt-2.5 text-[16px] text-[#615d59] leading-[1.6]">
                  {club.description}
                </p>
              </div>
              {club.mission && (
                <div className="pt-5 border-t border-black/[0.08]">
                  <h3 className="text-[16px] font-semibold text-black">Mission</h3>
                  <p className="mt-2 text-[15px] text-[#615d59] font-editorial">{club.mission}</p>
                </div>
              )}
            </section>

            <section className="notion-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#0075de]" />
                <h2 className="card-heading font-bold text-black">
                  Member Responsibilities & Expectations
                </h2>
              </div>
              {club.requirements.length === 0 ? (
                <p className="text-[14px] text-[#615d59]">
                  No formal requirements listed yet. Reach out to club leadership during onboarding.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {club.requirements.map((req) => (
                    <li
                      key={req}
                      className="p-3 rounded-[8px] bg-[#f6f5f4] border border-black/[0.06] text-[14px] text-black flex items-start gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#ffb110] mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="notion-card p-6">
              <h2 className="card-heading font-bold text-black">Upcoming Club Events</h2>
              {!club.events || club.events.length === 0 ? (
                <p className="mt-2 text-[14px] text-[#615d59]">
                  No upcoming events scheduled yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {club.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-[8px] border border-black/[0.08] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-[14px] font-semibold text-black">{ev.title}</div>
                        <div className="text-[12px] text-[#615d59]">
                          {new Date(ev.startDate).toLocaleString()} · {ev.location}
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" to="/events">
                        View Events
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="notion-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#0075de]" />
                <h2 className="text-[18px] font-bold text-black">Skills Developed</h2>
              </div>
              {club.skills.length === 0 ? (
                <p className="text-[13px] text-[#615d59]">Skills will be listed soon.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {club.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-[#e6f3fe] text-[#0075de] text-[13px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="notion-card p-6">
              <h2 className="text-[18px] font-bold text-black mb-4">Leadership Team</h2>
              {club.leadership.length === 0 ? (
                <p className="text-[13px] text-[#615d59]">No leaders listed.</p>
              ) : (
                <div className="space-y-3">
                  {club.leadership.map((leader) => {
                    const initials = leader.user.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={leader.membershipId}
                        className="flex items-center gap-3 p-2.5 rounded-[8px] bg-[#f6f5f4]"
                      >
                        <Avatar
                          initials={initials}
                          profileImage={leader.user.profileImage}
                          seed={leader.user.id}
                          color="#0075de"
                          size="md"
                        />
                        <div>
                          <div className="text-[14px] font-semibold text-black">
                            {leader.user.fullName}
                          </div>
                          <div className="text-[12px] text-[#615d59]">
                            {leader.role}
                            {leader.user.yearOfStudy ? ` · ${leader.user.yearOfStudy}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {club.userApplication && (
              <section className="rounded-[12px] p-6 bg-[#e6f3fe] border border-[#0075de]/20">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[#0075de] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Your Application
                </div>
                <div className="mt-1 text-[16px] font-bold text-black">
                  {club.userApplication.preferredRole}
                </div>
                <div className="mt-1 text-[13px] text-[#615d59]">
                  Status: <strong className="text-black">{club.userApplication.status}</strong> · Step{' '}
                  {club.userApplication.onboardingStep} of 6
                </div>
                <Button variant="primary" size="sm" to="/recruitment" className="mt-4">
                  View Application
                </Button>
              </section>
            )}
          </div>
        </div>
      </div>

      <JoinClubModal club={club} open={joinOpen} onClose={() => setJoinOpen(false)} />
    </MainLayout>
  );
};
