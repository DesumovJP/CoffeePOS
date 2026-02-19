/**
 * CoffeePOS - Tasks API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'daily' | 'task';

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
  completedAt?: string;
  completedBy?: string;
  createdBy?: string;
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
  createdBy?: string;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
  type?: TaskType;
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
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 100,
      'sort': params.sort || 'createdAt:desc',
    };

    if (params.status) {
      queryParams['filters[status][$eq]'] = params.status;
    }
    if (params.priority) {
      queryParams['filters[priority][$eq]'] = params.priority;
    }
    if (params.type) {
      queryParams['filters[type][$eq]'] = params.type;
    }
    if (params.assignedTo) {
      queryParams['filters[assignedTo][$eq]'] = params.assignedTo;
    }
    if (params.search) {
      queryParams['filters[$or][0][title][$containsi]'] = params.search;
      queryParams['filters[$or][1][description][$containsi]'] = params.search;
    }

    return apiClient.get<Task[]>('/tasks', queryParams);
  },

  async getById(documentId: string): Promise<ApiResponse<Task>> {
    return apiClient.get<Task>(`/tasks/${documentId}`);
  },

  async create(data: TaskCreateData): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>('/tasks', { data });
  },

  async update(documentId: string, data: TaskUpdateData): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/tasks/${documentId}`, { data });
  },

  async complete(documentId: string, completedBy: string): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>(`/tasks/${documentId}/complete`, { data: { completedBy } });
  },

  async delete(documentId: string): Promise<ApiResponse<Task>> {
    return apiClient.delete<Task>(`/tasks/${documentId}`);
  },
};
