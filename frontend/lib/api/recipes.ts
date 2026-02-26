/**
 * CoffeePOS - Recipes API
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
  image?: { id: number; url: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiRecipeInput {
  product?: number;
  sizeId: string;
  sizeName: string;
  sizeVolume?: string;
  price: number;
  costPrice?: number;
  isDefault?: boolean;
  ingredients: Array<{ ingredientId: number; amount: number }>;
  preparationNotes?: string;
  image?: number;
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
      'populate[0]': 'product',
      'populate[1]': 'image',
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
      'populate[0]': 'product',
      'populate[1]': 'image',
    });
  },

  async create(data: ApiRecipeInput): Promise<ApiResponse<ApiRecipe>> {
    return apiClient.post<ApiRecipe>('/recipes', { data });
  },

  async update(documentId: string, data: Partial<ApiRecipeInput>): Promise<ApiResponse<ApiRecipe>> {
    return apiClient.put<ApiRecipe>(`/recipes/${documentId}`, { data });
  },

  async delete(documentId: string): Promise<ApiResponse<ApiRecipe>> {
    return apiClient.delete<ApiRecipe>(`/recipes/${documentId}`);
  },
};
