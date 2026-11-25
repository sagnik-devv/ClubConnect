import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calendar, CheckCircle2, Circle, Clock, Megaphone, Pin } from 'lucide-react';
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
import { userService } from '../services/user.service';
import { taskService } from '../services/task.service';
import { presidentService } from '../services/president.service';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ClubLogoMark } from '../components/common/CharacterMarks';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { getApiErrorMessage } from '../services/api';
import { TaskStatus } from '../types';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: userService.getStudentAnalytics,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['member-announcements'],
    queryFn: presidentService.listMemberAnnouncements,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task status updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update task'));
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
          message={getApiErrorMessage(error, 'Could not load dashboard analytics')}
          onRetry={() => refetch()}
        />
      </WorkspaceLayout>
    );
  }

  const { summary, clubs, tasks, upcomingEvents, weeklyActivity, recentContributions } = data;

  return (
    <WorkspaceLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">
            Student Dashboard · {user?.fullName}
          </p>
          <h1 className="mt-1 text-[30px] sm:text-[38px] font-bold text-black tracking-[-0.03em] leading-tight">
            Good to see you! Ready to make today count?
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" to="/clubs">
            Explore Clubs
          </Button>
          <Button variant="primary" to="/tasks">
            Open Task Board
          </Button>
        </div>
      </div>

      {/* Real Overview Cards */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Active Clubs</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.activeMemberships} />
          </div>
          <div className="mt-2 text-[12px] text-[#0075de] font-medium">
            {summary.pendingApplications} pending application(s)
          </div>
        </div>

        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Pending Tasks</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.pendingTasks} />
          </div>
          <div className="mt-2 text-[12px] text-[#615d59]">
            {summary.completedTasks} completed
          </div>
        </div>

        <div className="notion-card p-5 bg-[#e6f3fe] border-[#0075de]/15">
          <div className="text-[13px] text-[#0075de] font-medium">Verified Points</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.totalVerifiedPoints} />
          </div>
          <div className="mt-2 text-[12px] text-[#615d59]">
            {summary.verifiedContributions} verified · {summary.totalVerifiedHours} hrs
          </div>
        </div>

        <div className="notion-card p-5">
          <div className="text-[13px] text-[#615d59]">Upcoming Events</div>
          <div className="mt-2 text-[32px] font-bold text-black leading-none">
            <AnimatedCounter value={summary.upcomingEventsCount} />
          </div>
          <div className="mt-2 text-[12px] text-[#615d59]">Registered sessions</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          {/* Assigned Tasks */}
          <section className="notion-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="card-heading font-bold text-black">My Assigned Tasks</h2>
                <p className="text-[13px] text-[#615d59]">
                  Tasks assigned to you across active club memberships.
                </p>
              </div>
              <Button variant="outline" size="sm" to="/tasks">
                Full Board
              </Button>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                title="No assigned tasks yet"
                description="When a club lead assigns a task to you, it will appear here."
              />
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const isDone = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({
                              id: task.id,
                              status: isDone ? 'IN_PROGRESS' : 'COMPLETED',
                            })
                          }
                          aria-label={`Toggle completion for ${task.title}`}
                          className="mt-0.5 text-[#0075de] cursor-pointer shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5 text-black/30 hover:text-[#0075de]" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div
                            className={`text-[14px] font-semibold ${
                              isDone ? 'line-through text-[#757575]' : 'text-black'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#615d59]">
                            <span>{task.club.name}</span>
                            {task.dueDate && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
                        <Badge
                          variant={
                            task.priority === 'URGENT' || task.priority === 'HIGH'
                              ? 'coral'
                              : task.priority === 'MEDIUM'
                              ? 'marigold'
                              : 'neutral'
                          }
                        >
                          {task.priority}
                        </Badge>
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: task.id,
                              status: e.target.value as TaskStatus,
                            })
                          }
                          className="px-2.5 py-1 rounded-[6px] border border-black/15 bg-white text-[12px] font-medium cursor-pointer"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Real Weekly Activity Chart */}
          <section className="notion-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="card-heading font-bold text-black">Weekly Activity</h2>
                <p className="text-[13px] text-[#615d59]">
                  Calculated from your completed tasks and logged contributions over the last 5 weeks.
                </p>
              </div>
              <Button variant="ghost" size="sm" to="/contributions">
                Contributions
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#0075de" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contributionsLogged" name="Contributions Logged" fill="#ffb110" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* My Clubs */}
          <section className="notion-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="card-heading font-bold text-black">My Clubs</h2>
              <Link to="/clubs" className="text-[13px] font-medium text-[#0075de] hover:underline">
                Discover clubs
              </Link>
            </div>

            {clubs.length === 0 ? (
              <EmptyState
                title="No active memberships"
                description="Apply to join a club or create one to collaborate with peers."
                action={
                  <Button variant="primary" size="sm" to="/clubs">
                    Browse Clubs
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clubs.map(({ membershipId, role, club }) => (
                  <div
                    key={membershipId}
                    className="p-4 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <ClubLogoMark
                          clubId={club.slug}
                          accentColor={club.accentColor || '#e6f3fe'}
                          size={40}
                        />
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold text-black truncate">{club.name}</div>
                          <div className="text-[12px] text-[#615d59]">{club.memberCount} members</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge variant="blue">{role}</Badge>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" to={`/clubs/${club.slug}`}>
                      View Club
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 space-y-6">
          <section className="notion-card p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#0075de]" />
                Club Announcements
              </h2>
            </div>

            {announcements.length === 0 ? (
              <p className="text-[14px] text-[#615d59]">
                No announcements from your clubs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-[10px] border ${
                      item.isPinned
                        ? 'border-[#0075de]/30 bg-[#e6f3fe]/30'
                        : 'border-black/[0.08] bg-[#faf9f8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#0075de]">
                        {item.club.name}
                      </span>
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0075de]">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[14px] font-semibold text-black">{item.title}</div>
                    <p className="mt-1 text-[12px] text-[#615d59] line-clamp-3">
                      {item.content}
                    </p>
                    <div className="mt-1.5 text-[11px] text-[#757575]">
                      {new Date(item.publishedAt).toLocaleDateString()} · {item.createdBy.fullName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="notion-card p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0075de]" />
                Upcoming Registered Events
              </h2>
              <Link to="/events" className="text-[13px] font-medium text-[#0075de] hover:underline">
                All events
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-[14px] text-[#615d59]">
                No upcoming registered events yet.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-[10px] border border-black/[0.08] bg-[#faf9f8]"
                  >
                    <div className="text-[11px] font-semibold text-[#0075de]">{ev.club.name}</div>
                    <div className="mt-1 text-[14px] font-semibold text-black">{ev.title}</div>
                    <div className="mt-1 text-[12px] text-[#615d59]">
                      {new Date(ev.startDate).toLocaleString()} · {ev.location}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="notion-card p-6">
            <h2 className="text-[18px] font-bold text-black mb-4">Recent Contributions</h2>
            {recentContributions.length === 0 ? (
              <p className="text-[14px] text-[#615d59]">No contributions logged yet.</p>
            ) : (
              <div className="space-y-4">
                {recentContributions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#0075de] mt-2 shrink-0" />
                      <div>
                        <div className="text-[13px] font-semibold text-black">{item.title}</div>
                        <div className="text-[12px] text-[#615d59]">
                          {item.club.name} · {item.hoursSpent}h
                        </div>
                      </div>
                    </div>
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
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
};
