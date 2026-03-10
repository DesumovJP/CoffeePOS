'use client';

/**
 * CoffeePOS - Tasks Hooks (offline-first)
 *
 * useStartTask  — saves startedAt to localStorage immediately, then syncs to backend.
 *                 If offline, queues the sync for when the browser reconnects.
 * useCompleteTask — calculates duration from localStorage timer, sends to backend.
 *                   Offline: queues completion for later sync.
 */

import { useEffect, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tasksApi,
  type GetTasksParams,
  type TaskCreateData,
  type TaskUpdateData,
  type TaskCompleteData,
} from '@/lib/api';
import { taskTimer, offlineQueue, type QueuedAction } from '@/lib/utils/taskTimer';

export const taskKeys = {
  all:     ['tasks'] as const,
  lists:   () => [...taskKeys.all, 'list'] as const,
  list:    (params: GetTasksParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail:  (id: string) => [...taskKeys.details(), id] as const,
};

// ─── queries ──────────────────────────────────────────────────────────────────

export function useTasks(params: GetTasksParams = {}) {
  return useQuery({
    queryKey:  taskKeys.list(params),
    queryFn:   () => tasksApi.getAll(params),
    select:    d => d.data,
    staleTime: 30_000,
  });
}

export function useTask(documentId: string) {
  return useQuery({
    queryKey: taskKeys.detail(documentId),
    queryFn:  () => tasksApi.getById(documentId),
    select:   d => d.data,
    enabled:  !!documentId,
  });
}

// ─── mutations ────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreateData) => tasksApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateData }) =>
      tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

/**
 * Start task — offline-first.
 * 1. Saves startedAt to localStorage immediately (timer always works offline).
 * 2. Sends PUT /tasks/:id { status: 'in_progress', startedAt } to backend.
 * 3. If offline: queues for sync on reconnect.
 */
export function useStartTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const startedAt = taskTimer.start(documentId);

      if (!navigator.onLine) {
        offlineQueue.push({
          type: 'start',
          documentId,
          startedAt: startedAt.toISOString(),
        });
        // Return a synthetic optimistic result so UI updates immediately
        return { data: { documentId, status: 'in_progress' as const, startedAt: startedAt.toISOString() } };
      }

      return tasksApi.update(documentId, {
        status:    'in_progress',
        startedAt: startedAt.toISOString(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

/**
 * Complete task — offline-first.
 * Duration is sourced from localStorage timer (accurate even if offline).
 */
export function useCompleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskCompleteData & { id: string }) => {
      const { id, ...rest } = data;
      const duration = rest.duration ?? taskTimer.elapsed(id) ?? 0;

      const payload: TaskCompleteData = { ...rest, duration };

      if (!navigator.onLine) {
        offlineQueue.push({
          type: 'complete',
          documentId: id,
          completedBy: rest.completedBy,
          duration,
          completionNote:    rest.completionNote,
          completionPhotoId: rest.completionPhotoId,
        });
        taskTimer.clear(id);
        return { data: { documentId: id, status: 'done' as const } };
      }

      const result = await tasksApi.complete(id, payload);
      taskTimer.clear(id);
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

// ─── offline queue sync ───────────────────────────────────────────────────────

/**
 * Hook that listens for `window.online` and replays any queued offline actions.
 * Mount once at the app level (tasks page is sufficient).
 */
export function useOfflineSync() {
  const qc = useQueryClient();

  const sync = useCallback(async () => {
    const actions = offlineQueue.drain();
    if (actions.length === 0) return;

    for (const action of actions) {
      try {
        await replayAction(action);
      } catch {
        // If replay fails again, re-queue
        offlineQueue.push(action);
      }
    }
    qc.invalidateQueries({ queryKey: taskKeys.lists() });
  }, [qc]);

  useEffect(() => {
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);
}

async function replayAction(action: QueuedAction) {
  if (action.type === 'start') {
    await tasksApi.update(action.documentId, {
      status:    'in_progress',
      startedAt: action.startedAt,
    });
  } else {
    await tasksApi.complete(action.documentId, {
      completedBy:       action.completedBy,
      duration:          action.duration,
      completionNote:    action.completionNote,
      completionPhotoId: action.completionPhotoId,
    });
    taskTimer.clear(action.documentId);
  }
}

// ─── live timer hook ──────────────────────────────────────────────────────────

/**
 * Returns elapsed seconds for a running (in_progress) task.
 * Sources startedAt from localStorage — works 100% offline.
 * Updates every second via setInterval.
 */
export function useTaskTimer(documentId: string, status: string): number | null {
  const [elapsed, setElapsed] = useState<number | null>(() =>
    status === 'in_progress' ? taskTimer.elapsed(documentId) : null
  );

  useEffect(() => {
    if (status !== 'in_progress') { setElapsed(null); return; }

    const tick = () => {
      const e = taskTimer.elapsed(documentId);
      setElapsed(e);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [documentId, status]);

  return elapsed;
}
