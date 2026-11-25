import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { clubService } from '../../services/club.service';
import { taskService } from '../../services/task.service';
import { getApiErrorMessage } from '../../services/api';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  editingTask?: TaskItem | null;
  defaultClubId?: string;
  defaultStatus?: TaskStatus;
}

interface TaskFormValues {
  title: string;
  description: string;
  clubId: string;
  assignedToId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  open,
  onClose,
  editingTask,
  defaultClubId,
  defaultStatus = 'TODO',
}) => {
  const { leaderMemberships } = useAuth();
  const queryClient = useQueryClient();

  const initialClubId =
    editingTask?.clubId || defaultClubId || leaderMemberships[0]?.clubId || '';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      clubId: initialClubId,
      assignedToId: '',
      dueDate: '',
      priority: 'MEDIUM',
      status: defaultStatus,
    },
  });

  const watchedClubId = watch('clubId') || initialClubId;

  const { data: members = [] } = useQuery({
    queryKey: ['club-members', watchedClubId],
    queryFn: () => clubService.getMembers(watchedClubId),
    enabled: Boolean(open && watchedClubId),
  });

  useEffect(() => {
    if (editingTask) {
      reset({
        title: editingTask.title,
        description: editingTask.description,
        clubId: editingTask.clubId,
        assignedToId: editingTask.assignedToId || '',
        dueDate: editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : '',
        priority: editingTask.priority,
        status: editingTask.status,
      });
    } else {
      reset({
        title: '',
        description: '',
        clubId: defaultClubId || leaderMemberships[0]?.clubId || '',
        assignedToId: '',
        dueDate: '',
        priority: 'MEDIUM',
        status: defaultStatus,
      });
    }
  }, [editingTask, defaultClubId, defaultStatus, leaderMemberships, reset, open]);

  const mutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const dueDateIso = values.dueDate ? new Date(values.dueDate).toISOString() : null;
      if (editingTask) {
        return taskService.updateTask(editingTask.id, {
          title: values.title.trim(),
          description: values.description.trim(),
          assignedToId: values.assignedToId || null,
          priority: values.priority,
          status: values.status,
          dueDate: dueDateIso,
        });
      }
      return taskService.createTask({
        title: values.title.trim(),
        description: values.description.trim(),
        clubId: values.clubId,
        assignedToId: values.assignedToId || null,
        priority: values.priority,
        status: values.status,
        dueDate: dueDateIso,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['club-stats'] });
      toast.success(editingTask ? 'Task updated' : 'Task created');
      onClose();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to save task'));
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTask ? 'Edit Task' : 'Create & Assign Task'}
      subtitle="Tasks are saved to PostgreSQL and notify assigned members."
    >
      <form onSubmit={handleSubmit((vals) => mutation.mutate(vals))} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-[13px] font-medium mb-1">
            Task Title *
          </label>
          <input
            id="task-title"
            type="text"
            {...register('title', { required: 'Task title is required' })}
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
          {errors.title && <p className="mt-1 text-[12px] text-[#e32d14]">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="task-desc" className="block text-[13px] font-medium mb-1">
            Description *
          </label>
          <textarea
            id="task-desc"
            rows={3}
            {...register('description', { required: 'Description is required' })}
            className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
          />
          {errors.description && (
            <p className="mt-1 text-[12px] text-[#e32d14]">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-club" className="block text-[13px] font-medium mb-1">
              Club
            </label>
            <select
              id="task-club"
              disabled={Boolean(editingTask)}
              {...register('clubId', { required: 'Club is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
            >
              {leaderMemberships.map((m) => (
                <option key={m.clubId} value={m.clubId}>
                  {m.club.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-assignee" className="block text-[13px] font-medium mb-1">
              Assign To Member
            </label>
            <select
              id="task-assignee"
              {...register('assignedToId')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.fullName} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="task-due" className="block text-[13px] font-medium mb-1">
              Due Date
            </label>
            <input
              id="task-due"
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-[13px] font-medium mb-1">
              Priority
            </label>
            <select
              id="task-priority"
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
            <label htmlFor="task-status" className="block text-[13px] font-medium mb-1">
              Status
            </label>
            <select
              id="task-status"
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
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
