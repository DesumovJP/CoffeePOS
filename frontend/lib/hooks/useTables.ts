'use client';

/**
 * CoffeePOS - Tables Hooks
 *
 * React Query hooks for cafe tables data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi, type GetTablesParams } from '@/lib/api';
import type { CafeTableInput } from '@/lib/api';

// ============================================
// QUERY KEYS
// ============================================

export const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (params: GetTablesParams) => [...tableKeys.lists(), params] as const,
  details: () => [...tableKeys.all, 'detail'] as const,
  detail: (id: string) => [...tableKeys.details(), id] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Hook to fetch all tables
 */
export function useTables(params: GetTablesParams = {}) {
  return useQuery({
    queryKey: tableKeys.list(params),
    queryFn: () => tablesApi.getAll(params),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch a single table by ID
 */
export function useTable(id: string) {
  return useQuery({
    queryKey: tableKeys.detail(id),
    queryFn: () => tablesApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook to create a table
 */
export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CafeTableInput) => tablesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() });
    },
  });
}

/**
 * Hook to update a table
 */
export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CafeTableInput> }) =>
      tablesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() });
    },
  });
}

/**
 * Hook to delete a table
 */
export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tablesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() });
    },
  });
}
