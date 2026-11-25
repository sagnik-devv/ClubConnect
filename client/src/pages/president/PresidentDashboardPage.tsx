import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckSquare,
  Megaphone,
  Plus,
  UserPlus,
  Users,
} from 'lucide-react';
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
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { useAuth } from '../../context/AuthContext';
import { presidentService } from '../../services/president.service';
import { AnimatedCounter } from '../../components/animations/AnimatedCounter';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';

export const PresidentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedClubId } = usePresidentClub();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-dashboard', selectedClubId],
    queryFn: () => presidentService.getDashboard(selectedClubId || undefined),
    enabled: Boolean(selectedClubId),
  });

  if (isLoading || !selectedClubId) {
    return (
      <PresidentLayout>
        <PageSkeleton />
      </PresidentLayout>
    );
  }

  if (isError || !data) {
    return (
      <PresidentLayout>
        <ErrorState
          message={getApiErrorMessage(error, 'Could not load President Dashboard')}
          onRetry={() => refetch()}
        />
      </PresidentLayout>
    );
  }

  const {
    club,
    overview,
    memberEngagement,
    taskOverview,
    workloadDistribution,
    contributionOverview,
    recruitmentOverview,
    upcomingEvents,
    recentActivityFeed,
  } = data;

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <PresidentLayout>
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">{todayFormatted}</p>
          <h1 className="mt-1 text-[30px] sm:text-[38px] font-bold text-black tracking-[-0.03em] leading-tight">
            Welcome back, {user?.fullName.split(' ')[0]} — {club.name}
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Live operational overview across members, tasks, contributions, recruitment, and events.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" to="/president/tasks">
            <Plus className="w-3.5 h-3.5" />
            Create Task
          </Button>
          <Button variant="secondary" size="sm" to="/president/events">
            <Calendar className="w-3.5 h-3.5" />
            Add Event
          </Button>
          <Button variant="secondary" size="sm" to="/president/announcements">
            <Megaphone className="w-3.5 h-3.5" />
            Publish Announcement
          </Button>
          <Button variant="outline" size="sm" to="/president/recruitment" className="bg-white">
            <UserPlus className="w-3.5 h-3.5" />
            Review Applications
          </Button>
        </div>
      </div>

      {/* 8 Overview Metrics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: overview.totalMembers, sub: 'Active club memberships', accent: false },
          { label: 'Pending Requests', value: overview.pendingRequests, sub: 'Awaiting approval', accent: false },
          { label: 'Active Tasks', value: overview.activeTasks, sub: `${overview.overdueTasks} overdue`, accent: true },
          { label: 'Completed Tasks', value: overview.completedTasks, sub: 'Shipped tasks', accent: false },
          { label: 'Overdue Tasks', value: overview.overdueTasks, sub: 'Past deadline', warn: overview.overdueTasks > 0 },
          { label: 'Pending Contributions', value: overview.pendingContributions, sub: 'Awaiting verification', accent: false },
          { label: 'Recruitment Apps', value: overview.recruitmentApplications, sub: 'Awaiting review', accent: false },
          { label: 'Upcoming Events', value: overview.upcomingEvents, sub: 'Scheduled sessions', accent: false },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`notion-card p-5 ${
              metric.accent
                ? 'bg-[#e6f3fe] border-[#0075de]/20'
                : metric.warn
                ? 'bg-[#f64932]/10 border-[#f64932]/30'
                : ''
            }`}
          >
            <div className="text-[12px] font-medium text-[#615d59]">{metric.label}</div>
            <div className="mt-1.5 text-[28px] font-bold text-black leading-none">
              <AnimatedCounter value={metric.value} />
            </div>
            <div className="mt-1.5 text-[12px] text-[#757575]">{metric.sub}</div>
          </div>
        ))}
      </div>

      {/* Sections A & C: Member Engagement + Workload Distribution */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 notion-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="card-heading font-bold text-black">C. Workload Distribution</h2>
              <p className="text-[13px] text-[#615d59]">
                {workloadDistribution.unassignedTasksCount} unassigned active tasks ·{' '}
                {workloadDistribution.overloadedMembers.length} overloaded (3+)
              </p>
            </div>
            {workloadDistribution.suggestedAssignee && (
              <Badge variant="blue">
                Suggested next: {workloadDistribution.suggestedAssignee.fullName} (
                {workloadDistribution.suggestedAssignee.activeTasks} active)
              </Badge>
            )}
          </div>

          {workloadDistribution.members.length === 0 ? (
            <p className="text-[14px] text-[#615d59]">No active members yet.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadDistribution.members.map((m) => ({
                    name: m.fullName.split(' ')[0],
                    activeTasks: m.activeTasks,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="activeTasks" name="Active Tasks" radius={[4, 4, 0, 0]}>
                    {workloadDistribution.members.map((m, idx) => (
                      <Cell key={idx} fill={m.activeTasks >= 3 ? '#f64932' : '#0075de'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="xl:col-span-5 notion-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="card-heading font-bold text-black">A. Member Engagement</h2>
            <Badge variant="green">{memberEngagement.engagementPercentage}% engaged (30d)</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[8px] bg-[#f6f5f4]">
              <div className="text-[12px] text-[#615d59]">Active (30d)</div>
              <div className="mt-1 text-[22px] font-bold text-black">
                {memberEngagement.activeMembersCount}
              </div>
            </div>
            <div className="p-3.5 rounded-[8px] bg-[#ffb110]/15">
              <div className="text-[12px] text-[#615d59]">No Recent Activity</div>
              <div className="mt-1 text-[22px] font-bold text-black">
                {memberEngagement.inactiveMembers.length}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#757575] mb-2">
              Most Active Members
            </div>
            {memberEngagement.mostActiveMembers.length === 0 ? (
              <p className="text-[13px] text-[#615d59]">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {memberEngagement.mostActiveMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="p-2.5 rounded-[8px] bg-[#faf9f8] border border-black/[0.06] flex items-center justify-between text-[13px]"
                  >
                    <span className="font-medium text-black">{m.fullName}</span>
                    <span className="text-[#615d59]">
                      {m.completedTasks} tasks · {m.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sections B, D, E */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* B. Task Overview */}
        <section className="notion-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#0075de]" />
              B. Task Overview
            </h2>
            <Button variant="ghost" size="sm" to="/president/tasks">
              Open
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div className="p-2.5 rounded-[8px] bg-[#f6f5f4]">
              To Do: <strong>{taskOverview.byStatus.TODO}</strong>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#e6f3fe]">
              In Progress: <strong>{taskOverview.byStatus.IN_PROGRESS}</strong>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#ffb110]/20">
              Review: <strong>{taskOverview.byStatus.UNDER_REVIEW}</strong>
            </div>
            <div className="p-2.5 rounded-[8px] bg-emerald-50">
              Completed: <strong>{taskOverview.byStatus.COMPLETED}</strong>
            </div>
          </div>
          {taskOverview.overdue.length > 0 && (
            <div className="p-3 rounded-[8px] bg-[#f64932]/10 border border-[#f64932]/25 text-[12px]">
              <div className="font-semibold text-[#c72914] flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overdue ({taskOverview.overdue.length})
              </div>
              {taskOverview.overdue.map((t) => (
                <div key={t.id} className="truncate text-black">
                  • {t.title}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* D. Contribution Overview */}
        <section className="notion-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0075de]" />
              D. Contributions
            </h2>
            <Button variant="ghost" size="sm" to="/president/contributions">
              Verify
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div className="p-2.5 rounded-[8px] bg-[#f6f5f4]">
              Verified: <strong>{contributionOverview.totalVerified}</strong>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#f6f5f4]">
              Hours: <strong>{contributionOverview.totalVerifiedHours}h</strong>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#e6f3fe]">
              Points: <strong>{contributionOverview.totalVerifiedPoints}</strong>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#ffb110]/20">
              Pending: <strong>{contributionOverview.pendingVerifications}</strong>
            </div>
          </div>
          {contributionOverview.topContributors.length > 0 && (
            <div className="space-y-1.5 text-[13px]">
              <div className="text-[12px] font-semibold text-[#757575]">Top Contributors</div>
              {contributionOverview.topContributors.map((c) => (
                <div key={c.userId} className="flex justify-between">
                  <span className="font-medium text-black">{c.fullName}</span>
                  <span className="text-[#615d59]">{c.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* E. Recruitment Overview */}
        <section className="notion-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0075de]" />
              E. Recruitment
            </h2>
            <Button variant="ghost" size="sm" to="/president/recruitment">
              Pipeline
            </Button>
          </div>
          <div className="space-y-2 text-[13px]">
            {[
              { label: 'Submitted', val: recruitmentOverview.SUBMITTED },
              { label: 'Under Review', val: recruitmentOverview.UNDER_REVIEW },
              { label: 'Shortlisted', val: recruitmentOverview.SHORTLISTED },
              { label: 'Accepted', val: recruitmentOverview.ACCEPTED },
              { label: 'Rejected', val: recruitmentOverview.REJECTED },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-2 rounded-[6px] bg-[#faf9f8]">
                <span className="text-[#615d59]">{row.label}</span>
                <strong className="text-black">{row.val}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sections F & G: Upcoming Events & Recent Activity Feed */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="notion-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-black">F. Upcoming Events</h2>
            <Button variant="ghost" size="sm" to="/president/events">
              Manage
            </Button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-[14px] text-[#615d59]">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-[14px] text-black">{ev.title}</div>
                    <div className="text-[12px] text-[#615d59]">
                      {new Date(ev.startDate).toLocaleString()} · {ev.location}
                    </div>
                  </div>
                  <Badge variant="blue">
                    {ev.registeredCount}/{ev.capacity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="notion-card p-6">
          <h2 className="text-[18px] font-bold text-black mb-4">G. Recent Activity Feed</h2>
          {recentActivityFeed.length === 0 ? (
            <p className="text-[14px] text-[#615d59]">No recent club activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivityFeed.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-[13px]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0075de] mt-1.5 shrink-0" />
                    <span className="text-black">{item.title}</span>
                  </div>
                  <span className="text-[11px] text-[#757575] shrink-0">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PresidentLayout>
  );
};
