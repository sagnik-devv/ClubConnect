import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';
import { taskService } from '../../services/task.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CreateTaskModal } from './CreateTaskModal';
import { EmptyState, ErrorState, PageSkeleton } from '../common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';

const COLUMNS: Array<{ id: TaskStatus; label: string; dotColor: string }> = [
  { id: 'TODO', label: 'To Do', dotColor: '#757575' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: '#0075de' },
  { id: 'UNDER_REVIEW', label: 'Under Review', dotColor: '#ffb110' },
  { id: 'COMPLETED', label: 'Completed', dotColor: '#16a34a' },
];

export const KanbanBoard: React.FC<{ clubFilterId?: string }> = ({ clubFilterId }) => {
  const { user, hasAnyLeadership, hasClubLeadership } = useAuth();
  const queryClient = useQueryClient();

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO');

  const { data: tasks = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tasks', { clubFilterId }],
    queryFn: () =>
      taskService.listTasks({
        clubId: clubFilterId && clubFilterId !== 'All' ? clubFilterId : undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', { clubFilterId }] });
      const prev = queryClient.getQueryData<TaskItem[]>(['tasks', { clubFilterId }]);
      if (prev) {
        queryClient.setQueryData<TaskItem[]>(
          ['tasks', { clubFilterId }],
          prev.map((t) => (t.id === id ? { ...t, status } : t))
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['tasks', { clubFilterId }], ctx.prev);
      }
      toast.error(getApiErrorMessage(err, 'Failed to move task'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete task'));
    },
  });

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.assignedTo) map.set(t.assignedTo.id, t.assignedTo.fullName);
    });
    return Array.from(map.entries());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'All' && t.assignedToId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter]);

  const workloadByMember = useMemo(() => {
    const counts = new Map<string, { name: string; activeCount: number }>();
    tasks.forEach((t) => {
      if (t.assignedTo && t.status !== 'COMPLETED') {
        const prev = counts.get(t.assignedTo.id) || {
          name: t.assignedTo.fullName,
          activeCount: 0,
        };
        prev.activeCount += 1;
        counts.set(t.assignedTo.id, prev);
      }
    });
    return Array.from(counts.values());
  }, [tasks]);

  if (isLoading) return <PageSkeleton />;
  if (isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, 'Could not load tasks')}
        onRetry={() => refetch()}
      />
    );
  }

  const priorityBadge = (priority: TaskPriority) => {
    if (priority === 'URGENT' || priority === 'HIGH') return 'coral';
    if (priority === 'MEDIUM') return 'marigold';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {workloadByMember.length > 0 && (
        <div className="notion-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-[15px] font-semibold text-black">Active Workload Snapshot</h2>
              <p className="text-[13px] text-[#615d59]">
                Count of non-completed tasks assigned per member.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {workloadByMember.map((item) => (
              <div
                key={item.name}
                className={`p-3 rounded-[8px] border text-[13px] ${
                  item.activeCount >= 3
                    ? 'bg-[#f64932]/10 border-[#f64932]/30'
                    : 'bg-white border-black/[0.08]'
                }`}
              >
                <div className="font-semibold text-black truncate">{item.name}</div>
                <div className="mt-1 flex items-center justify-between text-[12px] text-[#615d59]">
                  <span>{item.activeCount} active</span>
                  {item.activeCount >= 3 && (
                    <span className="font-semibold text-[#c72914]">High load</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'All')}
            className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
          >
            <option value="All">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            aria-label="Filter by assignee"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
          >
            <option value="All">All Assignees</option>
            {assignees.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {hasAnyLeadership && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingTask(null);
              setDefaultStatus('TODO');
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description={
            hasAnyLeadership
              ? 'Create the first task for your club to start coordinating work.'
              : 'Join a club or check back once club leaders publish sprint tasks.'
          }
          action={
            hasAnyLeadership ? (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingTask(null);
                  setDefaultStatus('TODO');
                  setModalOpen(true);
                }}
              >
                Create First Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.id);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  if (draggedTaskId) {
                    statusMutation.mutate({ id: draggedTaskId, status: col.id });
                    setDraggedTaskId(null);
                  }
                }}
                className={`rounded-[12px] border p-3.5 min-h-[320px] transition-colors ${
                  isOver
                    ? 'bg-[#e6f3fe]/70 border-[#0075de]'
                    : 'bg-[#faf9f8] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: col.dotColor }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                    <h3 className="text-[14px] font-semibold text-black">{col.label}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-black/[0.08] text-[11px] font-semibold text-[#615d59]">
                      {colTasks.length}
                    </span>
                  </div>
                  {hasAnyLeadership && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(null);
                        setDefaultStatus(col.id);
                        setModalOpen(true);
                      }}
                      aria-label={`Add task to ${col.label}`}
                      className="p-1 rounded-[6px] text-[#615d59] hover:text-black hover:bg-black/5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="rounded-[8px] border border-dashed border-black/15 p-5 text-center text-[13px] text-[#757575]">
                      No tasks in {col.label}.
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const canManage = hasClubLeadership(task.clubId);
                      const canMove = canManage || task.assignedToId === user?.id;

                      return (
                        <article
                          key={task.id}
                          draggable={canMove}
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverCol(null);
                          }}
                          className={`rounded-[10px] bg-white border border-black/[0.08] p-3.5 space-y-2.5 ${
                            canMove ? 'cursor-grab active:cursor-grabbing' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant={priorityBadge(task.priority)}>{task.priority}</Badge>
                            {canManage && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setModalOpen(true);
                                  }}
                                  aria-label={`Edit ${task.title}`}
                                  className="p-1 rounded-[6px] text-[#757575] hover:text-black hover:bg-[#f6f5f4] cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteMutation.mutate(task.id)}
                                  aria-label={`Delete ${task.title}`}
                                  className="p-1 rounded-[6px] text-[#757575] hover:text-[#e32d14] hover:bg-[#f64932]/10 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-[14px] font-semibold text-black leading-snug">
                              {task.title}
                            </h4>
                            <p className="mt-1 text-[12px] text-[#615d59] line-clamp-2">
                              {task.description}
                            </p>
                          </div>

                          <div className="text-[11px] text-[#615d59] flex flex-wrap items-center justify-between gap-1 pt-1">
                            <span className="font-medium text-black/80">
                              {task.assignedTo?.fullName || 'Unassigned'}
                            </span>
                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2">
                            <span className="text-[11px] text-[#757575] truncate">
                              {task.club.name}
                            </span>
                            <select
                              aria-label={`Change status for ${task.title}`}
                              disabled={!canMove}
                              value={task.status}
                              onChange={(e) =>
                                statusMutation.mutate({
                                  id: task.id,
                                  status: e.target.value as TaskStatus,
                                })
                              }
                              className="text-[11px] font-medium px-2 py-1 rounded-[6px] border border-black/10 bg-[#f6f5f4] text-black disabled:opacity-60"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="UNDER_REVIEW">Under Review</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasAnyLeadership && (
        <CreateTaskModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editingTask={editingTask}
          defaultClubId={clubFilterId !== 'All' ? clubFilterId : undefined}
          defaultStatus={defaultStatus}
        />
      )}
    </div>
  );
};
