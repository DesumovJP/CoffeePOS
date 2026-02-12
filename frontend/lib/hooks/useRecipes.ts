'use client';

/**
 * ParadisePOS - Recipes Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { recipesApi, type GetRecipesParams } from '@/lib/api';

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (params: GetRecipesParams) => [...recipeKeys.lists(), params] as const,
  byProduct: (productId: number) => [...recipeKeys.all, 'product', productId] as const,
};

export function useRecipes(params: GetRecipesParams = {}) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => recipesApi.getAll(params),
    select: (data) => data.data,
  });
}

export function useRecipesByProduct(productId: number) {
  return useQuery({
    queryKey: recipeKeys.byProduct(productId),
    queryFn: () => recipesApi.getByProduct(productId),
    select: (data) => data.data,
    enabled: !!productId,
  });
}
