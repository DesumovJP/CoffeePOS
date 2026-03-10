/**
 * CoffeePOS - Tasks API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export type TaskStatus   = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType     = 'daily' | 'task';

export interface TaskMedia {
  id: number;
  url: string;
  name: string;
}

export interface Task {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
  type: TaskType;
  // timing
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
  duration?: number;        // seconds
  // completion details
  completionNote?: string;
  completionPhoto?: TaskMedia;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
  type?: TaskType;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
  type?: TaskType;
  startedAt?: string;
}

export interface TaskCompleteData {
  completedBy: string;
  duration?: number;
  completionNote?: string;
  completionPhotoId?: number;
}

export interface GetTasksParams {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  sort?: string;
  assignedTo?: string;
  search?: string;
}

// ============================================
// API METHODS
// ============================================

export const tasksApi = {
  async getAll(params: GetTasksParams = {}): Promise<ApiResponse<Task[]>> {
    const q: Record<string, string | number | boolean | undefined> = {
      'pagination[pageSize]': params.pageSize || 100,
      'sort': params.sort || 'createdAt:desc',
      'populate': 'completionPhoto',
    };
    if (params.page)       q['pagination[page]']             = params.page;
    if (params.status)     q['filters[status][$eq]']         = params.status;
    if (params.priority)   q['filters[priority][$eq]']       = params.priority;
    if (params.type)       q['filters[type][$eq]']           = params.type;
    if (params.assignedTo) q['filters[assignedTo][$eq]']     = params.assignedTo;
    if (params.search) {
      q['filters[$or][0][title][$containsi]']       = params.search;
      q['filters[$or][1][description][$containsi]'] = params.search;
    }
    return apiClient.get<Task[]>('/tasks', q);
  },

  async getById(documentId: string): Promise<ApiResponse<Task>> {
    return apiClient.get<Task>(`/tasks/${documentId}`, { populate: 'completionPhoto' });
  },

  async create(data: TaskCreateData): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>('/tasks', { data });
  },

  async update(documentId: string, data: TaskUpdateData): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/tasks/${documentId}`, { data });
  },

  async complete(documentId: string, data: TaskCompleteData): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>(`/tasks/${documentId}/complete`, { data });
  },

  async delete(documentId: string): Promise<ApiResponse<Task>> {
    return apiClient.delete<Task>(`/tasks/${documentId}`);
  },
};
