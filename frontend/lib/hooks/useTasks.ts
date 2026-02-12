'use client';

/**
 * ParadisePOS - Tasks Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type GetTasksParams, type TaskCreateData, type TaskUpdateData } from '@/lib/api';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: GetTasksParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
};

export function useTasks(params: GetTasksParams = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.getAll(params),
    select: (data) => data.data,
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreateData) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdateData }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completedBy }: { id: number; completedBy: string }) =>
      tasksApi.complete(id, completedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
