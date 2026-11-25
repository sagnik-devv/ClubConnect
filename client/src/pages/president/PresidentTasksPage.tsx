import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calendar, Edit2, Eye, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { useAuth } from '../../context/AuthContext';
import { presidentService } from '../../services/president.service';
import { taskService } from '../../services/task.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';

type TaskViewTab = 'kanban' | 'table' | 'created' | 'unassigned' | 'overdue';

const COLUMNS: Array<{ id: TaskStatus; label: string; dotColor: string }> = [
  { id: 'TODO', label: 'To Do', dotColor: '#757575' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: '#0075de' },
  { id: 'UNDER_REVIEW', label: 'Under Review', dotColor: '#ffb110' },
  { id: 'COMPLETED', label: 'Completed', dotColor: '#16a34a' },
];

interface TaskFormValues {
  title: string;
  description: string;
  assignedToId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export const PresidentTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [viewTab, setViewTab] = useState<TaskViewTab>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [detailTask, setDetailTask] = useState<
    | (TaskItem & {
        activities?: Array<{
          id: string;
          action: string;
          oldValue: string | null;
          newValue: string | null;
          createdAt: string;
          user: { fullName: string };
        }>;
      })
    | null
  >(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-tasks', selectedClubId],
    queryFn: () => presidentService.listTasksWithWorkload(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<TaskFormValues>({
      defaultValues: { priority: 'MEDIUM', status: 'TODO' },
    });

  const saveMutation = useMutation({
    mutationFn: async (vals: TaskFormValues) => {
      const dueDateIso = vals.dueDate ? new Date(vals.dueDate).toISOString() : null;
      if (editingTask) {
        return taskService.updateTask(editingTask.id, {
          title: vals.title.trim(),
          description: vals.description.trim(),
          assignedToId: vals.assignedToId || null,
          priority: vals.priority,
          status: vals.status,
          dueDate: dueDateIso,
        });
      }
      return presidentService.createTask(selectedClubId, {
        title: vals.title.trim(),
        description: vals.description.trim(),
        assignedToId: vals.assignedToId || null,
        priority: vals.priority,
        status: vals.status,
        dueDate: dueDateIso,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-tasks', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success(editingTask ? 'Task updated' : 'Task created');
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not save task'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-tasks', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success('Status updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update status')),
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-tasks', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete task')),
  });

  const tasks = data?.tasks ?? [];
  const membersWorkload = data?.membersWorkload ?? [];
  const suggestedAssignee = data?.suggestedAssignee ?? null;

  const filteredTasks = useMemo(() => {
    const now = Date.now();
    if (viewTab === 'created') return tasks.filter((t) => t.createdById === user?.id);
    if (viewTab === 'unassigned') return tasks.filter((t) => !t.assignedToId);
    if (viewTab === 'overdue') {
      return tasks.filter(
        (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate).getTime() < now
      );
    }
    return tasks;
  }, [tasks, viewTab, user?.id]);

  const openCreate = () => {
    setEditingTask(null);
    reset({
      title: '',
      description: '',
      assignedToId: suggestedAssignee?.userId || '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
    });
    setModalOpen(true);
  };

  const openEdit = (task: TaskItem) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description,
      assignedToId: task.assignedToId || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  return (
    <PresidentLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">
            {selectedClub?.name} · Task Management
          </p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            Club Task Board
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Assign tasks with real-time member workload visibility and activity tracking.
          </p>
        </div>

        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      {/* View Switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[
          { id: 'kanban', label: 'Kanban Board' },
          { id: 'table', label: 'Table View' },
          { id: 'created', label: 'My Created Tasks' },
          { id: 'unassigned', label: 'Unassigned Tasks' },
          { id: 'overdue', label: 'Overdue Tasks' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewTab(tab.id as TaskViewTab)}
            className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium cursor-pointer ${
              viewTab === tab.id
                ? 'bg-[#0075de] text-white'
                : 'bg-white border border-black/10 text-[#615d59] hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load club tasks')}
            onRetry={() => refetch()}
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks in this view"
            description="Create a new task or switch tabs to see other club tasks."
            action={
              <Button variant="primary" size="sm" onClick={openCreate}>
                Create Task
              </Button>
            }
          />
        ) : viewTab === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="rounded-[12px] border border-black/[0.08] bg-[#faf9f8] p-3.5 min-h-[300px]"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: col.dotColor }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      <span className="text-[14px] font-semibold text-black">{col.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-black/[0.08] text-[11px] font-semibold">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((t) => (
                      <article
                        key={t.id}
                        className="rounded-[10px] bg-white border border-black/[0.08] p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant={
                              t.priority === 'URGENT' || t.priority === 'HIGH'
                                ? 'coral'
                                : t.priority === 'MEDIUM'
                                ? 'marigold'
                                : 'neutral'
                            }
                          >
                            {t.priority}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTask(t)}
                              className="p-1 text-[#0075de] hover:bg-[#e6f3fe] rounded cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className="p-1 text-[#757575] hover:text-black rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(t.id)}
                              className="p-1 text-[#757575] hover:text-[#e32d14] rounded cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-[14px] font-semibold text-black">{t.title}</h3>
                        <p className="text-[12px] text-[#615d59] line-clamp-2">{t.description}</p>
                        <div className="text-[11px] text-[#615d59] flex items-center justify-between">
                          <span>{t.assignedTo?.fullName || 'Unassigned'}</span>
                          {t.dueDate && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <select
                          aria-label={`Change status for ${t.title}`}
                          value={t.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: t.id,
                              status: e.target.value as TaskStatus,
                            })
                          }
                          className="w-full text-[11px] font-medium px-2 py-1 rounded-[6px] border border-black/10 bg-[#f6f5f4]"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-[#faf9f8] text-[12px] font-semibold uppercase tracking-wider text-[#757575]">
                    <th className="py-3 px-5">Task</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] text-[13px]">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-[#f6f5f4]/60">
                      <td className="py-3 px-5 font-semibold text-black">{t.title}</td>
                      <td className="py-3 px-4">{t.assignedTo?.fullName || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={t.priority === 'HIGH' || t.priority === 'URGENT' ? 'coral' : 'neutral'}>
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#615d59]">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            statusMutation.mutate({ id: t.id, status: e.target.value as TaskStatus })
                          }
                          className="px-2 py-1 rounded-[6px] border border-black/15 bg-white text-[12px]"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setDetailTask(t)}
                          className="text-[#0075de] hover:underline cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="text-black hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Workload-Aware Task Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Club Task' : 'Create & Assign Task'}
        subtitle="Workload counts below come directly from active tasks in PostgreSQL."
      >
        <form onSubmit={handleSubmit((vals) => saveMutation.mutate(vals))} className="space-y-4">
          {suggestedAssignee && (
            <div className="p-3 rounded-[8px] bg-[#e6f3fe] border border-[#0075de]/20 flex items-center justify-between gap-3 text-[13px]">
              <div className="flex items-center gap-2 text-black">
                <Sparkles className="w-4 h-4 text-[#0075de] shrink-0" />
                <span>
                  Suggested assignee (lightest active load):{' '}
                  <strong>{suggestedAssignee.fullName}</strong> ({suggestedAssignee.activeTasksCount}{' '}
                  active)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setValue('assignedToId', suggestedAssignee.userId)}
                className="text-[#0075de] font-semibold hover:underline shrink-0 cursor-pointer"
              >
                Use
              </button>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium mb-1">Task Title *</label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
            {errors.title && <p className="mt-1 text-[12px] text-[#e32d14]">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1">Description *</label>
            <textarea
              rows={3}
              {...register('description', { required: 'Description is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1">
              Assign Member (showing active task workload)
            </label>
            <select
              {...register('assignedToId')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
            >
              <option value="">Unassigned</option>
              {membersWorkload.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName} ({m.role}) — {m.activeTasksCount} active task(s)
                  {m.isHighLoad ? ' [High Workload]' : ''}
                </option>
              ))}
            </select>
            {membersWorkload.some((m) => m.isHighLoad) && (
              <p className="mt-1 text-[12px] text-[#c72914] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Members marked [High Workload] currently have 3+ active tasks.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-medium mb-1">Deadline</label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Detail + Activity Modal */}
      <Modal
        open={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        title={detailTask?.title || 'Task Details'}
        subtitle={
          detailTask
            ? `Assigned to: ${detailTask.assignedTo?.fullName || 'Unassigned'} · Created by: ${
                detailTask.createdBy?.fullName || 'Leader'
              }`
            : ''
        }
      >
        {detailTask && (
          <div className="space-y-4 text-[14px]">
            <p className="text-[#615d59]">{detailTask.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">{detailTask.status}</Badge>
              <Badge variant="marigold">{detailTask.priority}</Badge>
              {detailTask.dueDate && (
                <Badge variant="neutral">
                  Due {new Date(detailTask.dueDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <div className="pt-3 border-t border-black/[0.08]">
              <h3 className="font-semibold text-black mb-2">Activity Timeline</h3>
              {!detailTask.activities || detailTask.activities.length === 0 ? (
                <p className="text-[13px] text-[#615d59]">No activity entries yet.</p>
              ) : (
                <div className="space-y-2 text-[13px]">
                  {detailTask.activities.map((a) => (
                    <div key={a.id} className="p-2 rounded-[6px] bg-[#f6f5f4] flex justify-between">
                      <span>
                        <strong>{a.user.fullName}</strong> {a.action.toLowerCase().replace('_', ' ')}
                        {a.newValue ? ` → ${a.newValue}` : ''}
                      </span>
                      <span className="text-[#757575]">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PresidentLayout>
  );
};
