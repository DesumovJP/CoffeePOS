/**
 * ParadisePOS - Recipes API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export interface ApiRecipe {
  id: number;
  documentId: string;
  product?: { id: number; name: string; slug: string };
  sizeId: string;
  sizeName: string;
  sizeVolume?: string;
  price: number;
  costPrice: number;
  isDefault: boolean;
  ingredients: Array<{ ingredientId: number; amount: number }>;
  preparationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetRecipesParams {
  product?: number;
}

// ============================================
// API METHODS
// ============================================

export const recipesApi = {
  async getAll(params: GetRecipesParams = {}): Promise<ApiResponse<ApiRecipe[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'populate': 'product',
      'pagination[pageSize]': 200,
    };

    if (params.product) {
      queryParams['filters[product][id][$eq]'] = params.product;
    }

    return apiClient.get<ApiRecipe[]>('/recipes', queryParams);
  },

  async getByProduct(productId: number): Promise<ApiResponse<ApiRecipe[]>> {
    return apiClient.get<ApiRecipe[]>('/recipes', {
      'filters[product][id][$eq]': productId,
      'populate': 'product',
    });
  },
};
