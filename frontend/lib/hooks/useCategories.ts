'use client';

/**
 * ParadisePOS - Categories Hooks
 *
 * React Query hooks for categories data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, type GetCategoriesParams } from '@/lib/api';
import type { Category, CategoryInput } from '@/lib/api';

// ============================================
// QUERY KEYS
// ============================================

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: GetCategoriesParams) => [...categoryKeys.lists(), params] as const,
  active: () => [...categoryKeys.all, 'active'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Hook to fetch all categories
 */
export function useCategories(params: GetCategoriesParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesApi.getAll(params),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch active categories (for POS)
 */
export function useActiveCategories() {
  return useQuery({
    queryKey: categoryKeys.active(),
    queryFn: () => categoriesApi.getActive(),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryInput) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.active() });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryInput> }) =>
      categoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.active() });
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.active() });
    },
  });
}

/**
 * Hook to reorder categories
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) => categoriesApi.reorder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.active() });
    },
  });
}
