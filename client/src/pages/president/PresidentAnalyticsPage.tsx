import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, CheckSquare, Clock, UserPlus, Users } from 'lucide-react';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { presidentService } from '../../services/president.service';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';

const PIE_COLORS = ['#0075de', '#ffb110', '#62aef0', '#f64932', '#02093a', '#615d59'];

export const PresidentAnalyticsPage: React.FC = () => {
  const { selectedClubId, selectedClub } = usePresidentClub();
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '180d' | 'custom'>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-analytics', selectedClubId, range, from, to],
    queryFn: () =>
      presidentService.getAnalytics(selectedClubId, {
        range,
        from: range === 'custom' && from ? new Date(from).toISOString() : undefined,
        to: range === 'custom' && to ? new Date(to).toISOString() : undefined,
      }),
    enabled: Boolean(selectedClubId) && (range !== 'custom' || (Boolean(from) && Boolean(to))),
  });

  const hasAnyData =
    data &&
    (data.engagement.totalMembers > 0 ||
      data.tasks.total > 0 ||
      data.contributions.verifiedCount > 0 ||
      data.recruitment.total > 0);

  return (
    <PresidentLayout>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">
            {selectedClub?.name} · Real-Time Club Insights
          </p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            Club Analytics
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Live operational metrics calculated directly from PostgreSQL task, contribution, membership, and recruitment records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '90d', '180d', 'custom'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium border cursor-pointer ${
                range === r
                  ? 'bg-[#0075de] text-white border-[#0075de]'
                  : 'bg-white text-[#615d59] border-black/[0.08] hover:text-black'
              }`}
            >
              {r === 'custom' ? 'Custom' : `Last ${r}`}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="notion-card p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#615d59]">From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 px-2.5 rounded-[8px] border border-black/[0.12] bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#615d59]">To:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 px-2.5 rounded-[8px] border border-black/[0.12] bg-white"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : !data || !hasAnyData ? (
        <EmptyState
          title="No analytics activity in this range"
          description="Assign tasks, review contributions, or open recruitment to generate club analytics."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="notion-card p-5">
              <div className="flex items-center justify-between text-[#757575] text-[12px] font-semibold uppercase tracking-wider">
                Member Engagement
                <Users className="w-4 h-4 text-[#0075de]" />
              </div>
              <div className="mt-2 text-[28px] font-bold text-black">
                {data.engagement.activePercentage}%
              </div>
              <div className="mt-1 text-[13px] text-[#615d59]">
                {data.engagement.activeMembersCount} active / {data.engagement.totalMembers} total · +
                {data.engagement.newMembersInRange} new
              </div>
            </div>

            <div className="notion-card p-5">
              <div className="flex items-center justify-between text-[#757575] text-[12px] font-semibold uppercase tracking-wider">
                Task Completion Rate
                <CheckSquare className="w-4 h-4 text-[#0075de]" />
              </div>
              <div className="mt-2 text-[28px] font-bold text-black">
                {data.tasks.completionRate}%
              </div>
              <div className="mt-1 text-[13px] text-[#615d59]">
                {data.tasks.completed} done · {data.tasks.pending} pending · {data.tasks.overdue} overdue
              </div>
            </div>

            <div className="notion-card p-5">
              <div className="flex items-center justify-between text-[#757575] text-[12px] font-semibold uppercase tracking-wider">
                Avg Completion Time
                <Clock className="w-4 h-4 text-[#ffb110]" />
              </div>
              <div className="mt-2 text-[28px] font-bold text-black">
                {data.tasks.avgCompletionHours}h
              </div>
              <div className="mt-1 text-[13px] text-[#615d59]">
                {data.tasks.unassigned} currently unassigned tasks
              </div>
            </div>

            <div className="notion-card p-5">
              <div className="flex items-center justify-between text-[#757575] text-[12px] font-semibold uppercase tracking-wider">
                Recruitment Acceptance
                <UserPlus className="w-4 h-4 text-[#f64932]" />
              </div>
              <div className="mt-2 text-[28px] font-bold text-black">
                {data.recruitment.acceptanceRate}%
              </div>
              <div className="mt-1 text-[13px] text-[#615d59]">
                {data.recruitment.accepted} accepted / {data.recruitment.total} applications
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Distribution */}
            <section className="notion-card p-6">
              <h2 className="text-[18px] font-bold text-black">Member Workload Distribution</h2>
              <p className="text-[13px] text-[#615d59] mb-4">
                Active vs completed tasks across active club members.
              </p>
              {data.workload.length === 0 ? (
                <p className="text-[14px] text-[#615d59] py-8 text-center">No member task data yet.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.workload}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="activeTasks" name="Active Tasks" fill="#0075de" radius={[4, 4, 0, 0]} />
                      <Bar
                        dataKey="completedTasks"
                        name="Completed Tasks"
                        fill="#ffb110"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Contribution Breakdown */}
            <section className="notion-card p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-black">Contributions by Type</h2>
                  <p className="text-[13px] text-[#615d59]">
                    {data.contributions.verifiedCount} verified · {data.contributions.totalHours}h ·{' '}
                    {data.contributions.totalPoints} pts
                  </p>
                </div>
                <Award className="w-5 h-5 text-[#0075de]" />
              </div>

              {data.contributions.byType.length === 0 ? (
                <p className="text-[14px] text-[#615d59] py-8 text-center">
                  No verified contributions recorded in this period.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.contributions.byType}
                          dataKey="points"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {data.contributions.byType.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {data.contributions.byType.map((row, idx) => (
                      <div
                        key={row.type}
                        className="flex items-center justify-between text-[13px] p-2 rounded-[8px] bg-[#faf9f8]"
                      >
                        <div className="flex items-center gap-2 font-medium text-black">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          {row.type}
                        </div>
                        <div className="text-[#615d59]">
                          {row.count} · {row.points} pts · {row.hours}h
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </PresidentLayout>
  );
};
