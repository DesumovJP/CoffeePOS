/**
 * ParadisePOS - Mock Recipes API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { ApiRecipe, GetRecipesParams } from '@/lib/api/recipes';
import { getStore } from '../store';
import { mockDelay, wrapResponse } from '../helpers';

export const mockRecipesApi = {
  async getAll(params: GetRecipesParams = {}): Promise<ApiResponse<ApiRecipe[]>> {
    await mockDelay();
    let items = [...getStore().recipes];

    if (params.product) {
      items = items.filter((r) => r.product?.id === params.product);
    }

    return wrapResponse(items, items.length);
  },

  async getByProduct(productId: number): Promise<ApiResponse<ApiRecipe[]>> {
    await mockDelay();
    const items = getStore().recipes.filter((r) => r.product?.id === productId);
    return wrapResponse(items, items.length);
  },
};
