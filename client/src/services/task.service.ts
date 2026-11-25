import { api } from './api';
import { ApiResponse, TaskItem, TaskPriority, TaskStatus } from '../types';

export const taskService = {
  async listTasks(params?: {
    clubId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: string;
    sort?: 'dueDate' | 'createdAt';
  }) {
    const res = await api.get<ApiResponse<TaskItem[]>>('/tasks', { params });
    return res.data.data;
  },

  async createTask(payload: {
    title: string;
    description: string;
    clubId: string;
    assignedToId?: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: string | null;
  }) {
    const res = await api.post<ApiResponse<TaskItem>>('/tasks', payload);
    return res.data.data;
  },

  async updateTask(
    id: string,
    payload: {
      title?: string;
      description?: string;
      assignedToId?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: string | null;
    }
  ) {
    const res = await api.patch<ApiResponse<TaskItem>>(`/tasks/${id}`, payload);
    return res.data.data;
  },

  async updateStatus(id: string, status: TaskStatus) {
    const res = await api.patch<ApiResponse<TaskItem>>(`/tasks/${id}/status`, { status });
    return res.data.data;
  },

  async deleteTask(id: string) {
    await api.delete(`/tasks/${id}`);
  },

  async getActivity(id: string) {
    const res = await api.get<ApiResponse<unknown[]>>(`/tasks/${id}/activity`);
    return res.data.data;
  },
};
