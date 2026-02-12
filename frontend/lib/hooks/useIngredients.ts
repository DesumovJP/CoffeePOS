'use client';

/**
 * ParadisePOS - Ingredients Hooks
 *
 * React Query hooks for ingredients and inventory data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ingredientsApi,
  ingredientCategoriesApi,
  inventoryTransactionsApi,
  type GetIngredientsParams,
  type GetIngredientCategoriesParams,
  type GetInventoryTransactionsParams,
} from '@/lib/api';
import type {
  Ingredient,
  IngredientInput,
  IngredientCategory,
  IngredientCategoryInput,
  InventoryTransaction,
  InventoryTransactionInput,
} from '@/lib/api';

// ============================================
// QUERY KEYS
// ============================================

export const ingredientKeys = {
  all: ['ingredients'] as const,
  lists: () => [...ingredientKeys.all, 'list'] as const,
  list: (params: GetIngredientsParams) => [...ingredientKeys.lists(), params] as const,
  details: () => [...ingredientKeys.all, 'detail'] as const,
  detail: (id: number) => [...ingredientKeys.details(), id] as const,
  lowStock: () => [...ingredientKeys.all, 'low-stock'] as const,
};

export const ingredientCategoryKeys = {
  all: ['ingredient-categories'] as const,
  lists: () => [...ingredientCategoryKeys.all, 'list'] as const,
  list: (params: GetIngredientCategoriesParams) => [...ingredientCategoryKeys.lists(), params] as const,
  details: () => [...ingredientCategoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...ingredientCategoryKeys.details(), id] as const,
};

export const inventoryTransactionKeys = {
  all: ['inventory-transactions'] as const,
  lists: () => [...inventoryTransactionKeys.all, 'list'] as const,
  list: (params: GetInventoryTransactionsParams) => [...inventoryTransactionKeys.lists(), params] as const,
};

// ============================================
// INGREDIENT QUERIES
// ============================================

/**
 * Hook to fetch all ingredients
 */
export function useIngredients(params: GetIngredientsParams = {}) {
  return useQuery({
    queryKey: ingredientKeys.list(params),
    queryFn: () => ingredientsApi.getAll(params),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch a single ingredient by ID
 */
export function useIngredient(id: number) {
  return useQuery({
    queryKey: ingredientKeys.detail(id),
    queryFn: () => ingredientsApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

/**
 * Hook to fetch low stock ingredients
 */
export function useLowStockIngredients() {
  return useQuery({
    queryKey: ingredientKeys.lowStock(),
    queryFn: () => ingredientsApi.getLowStock(),
    select: (data) => data.data,
  });
}

// ============================================
// INGREDIENT MUTATIONS
// ============================================

/**
 * Hook to create a new ingredient
 */
export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IngredientInput) => ingredientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}

/**
 * Hook to update an ingredient
 */
export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IngredientInput> }) =>
      ingredientsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}

/**
 * Hook to delete an ingredient
 */
export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ingredientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}

/**
 * Hook to adjust ingredient quantity
 */
export function useAdjustIngredientQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      adjustment,
      type,
      notes,
    }: {
      id: number;
      adjustment: number;
      type?: InventoryTransaction['type'];
      notes?: string;
    }) => ingredientsApi.adjustQuantity(id, adjustment, type, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.lists() });
    },
  });
}

// ============================================
// INGREDIENT CATEGORY QUERIES
// ============================================

/**
 * Hook to fetch all ingredient categories
 */
export function useIngredientCategories(params: GetIngredientCategoriesParams = {}) {
  return useQuery({
    queryKey: ingredientCategoryKeys.list(params),
    queryFn: () => ingredientCategoriesApi.getAll(params),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch active ingredient categories
 */
export function useActiveIngredientCategories() {
  return useIngredientCategories({ isActive: true });
}

/**
 * Hook to fetch a single ingredient category by ID
 */
export function useIngredientCategory(id: number) {
  return useQuery({
    queryKey: ingredientCategoryKeys.detail(id),
    queryFn: () => ingredientCategoriesApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

// ============================================
// INGREDIENT CATEGORY MUTATIONS
// ============================================

/**
 * Hook to create a new ingredient category
 */
export function useCreateIngredientCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IngredientCategoryInput) => ingredientCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientCategoryKeys.lists() });
    },
  });
}

/**
 * Hook to update an ingredient category
 */
export function useUpdateIngredientCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IngredientCategoryInput> }) =>
      ingredientCategoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ingredientCategoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ingredientCategoryKeys.lists() });
    },
  });
}

/**
 * Hook to delete an ingredient category
 */
export function useDeleteIngredientCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ingredientCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientCategoryKeys.lists() });
    },
  });
}

// ============================================
// INVENTORY TRANSACTION QUERIES
// ============================================

/**
 * Hook to fetch inventory transactions
 */
export function useInventoryTransactions(params: GetInventoryTransactionsParams = {}) {
  return useQuery({
    queryKey: inventoryTransactionKeys.list(params),
    queryFn: () => inventoryTransactionsApi.getAll(params),
    select: (data) => data.data,
  });
}

/**
 * Hook to create an inventory transaction
 */
export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InventoryTransactionInput) => inventoryTransactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}
