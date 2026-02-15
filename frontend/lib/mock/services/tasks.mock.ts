/**
 * CoffeePOS - Mock Tasks API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { Task, TaskCreateData, TaskUpdateData, GetTasksParams } from '@/lib/api/tasks';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';

export const mockTasksApi = {
  async getAll(params: GetTasksParams = {}): Promise<ApiResponse<Task[]>> {
    await mockDelay();
    const store = getStore();
    let items = [...store.tasks];

    if (params.status) {
      items = items.filter((t) => t.status === params.status);
    }
    if (params.priority) {
      items = items.filter((t) => t.priority === params.priority);
    }
    if (params.type) {
      items = items.filter((t) => t.type === params.type);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<Task>> {
    await mockDelay();
    const store = getStore();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) throw { status: 404, name: 'NotFoundError', message: 'Task not found' };
    return wrapResponse(task);
  },

  async create(data: TaskCreateData): Promise<ApiResponse<Task>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const task: Task = {
      id: store.getId(),
      documentId: generateDocumentId(),
      title: data.title,
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      type: data.type || 'task',
      createdAt: now,
      updatedAt: now,
    };

    store.tasks.unshift(task);
    return wrapResponse(task);
  },

  async update(id: number, data: TaskUpdateData): Promise<ApiResponse<Task>> {
    await mockDelay();
    const store = getStore();
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Task not found' };

    store.tasks[idx] = {
      ...store.tasks[idx],
      ...data,
      updatedAt: nowISO(),
    };

    return wrapResponse(store.tasks[idx]);
  },

  async complete(id: number, completedBy: string): Promise<ApiResponse<Task>> {
    await mockDelay();
    const store = getStore();
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Task not found' };

    const now = nowISO();
    store.tasks[idx] = {
      ...store.tasks[idx],
      status: 'done',
      completedAt: now,
      completedBy,
      updatedAt: now,
    };

    return wrapResponse(store.tasks[idx]);
  },

  async delete(id: number): Promise<ApiResponse<Task>> {
    await mockDelay();
    const store = getStore();
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Task not found' };

    const [removed] = store.tasks.splice(idx, 1);
    return wrapResponse(removed);
  },
};
