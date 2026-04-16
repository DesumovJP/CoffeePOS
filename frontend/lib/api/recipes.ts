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
  variantId: string;
  variantName: string;
  variantDescription?: string;
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
  variantId: string;
  variantName: string;
  variantDescription?: string;
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
// HELPERS
// ============================================

/**
 * Normalize recipe fields from the API response.
 * Production backend may still use old field names (sizeId/sizeName/sizeVolume).
 * This maps them to the new names (variantId/variantName/variantDescription)
 * so the frontend works with both old and new backend schemas.
 */
function normalizeRecipe(raw: any): ApiRecipe {
  return {
    ...raw,
    variantId: raw.variantId ?? raw.sizeId,
    variantName: raw.variantName ?? raw.sizeName,
    variantDescription: raw.variantDescription ?? raw.sizeVolume,
  };
}

function normalizeRecipes(response: ApiResponse<ApiRecipe[]>): ApiResponse<ApiRecipe[]> {
  return { ...response, data: response.data.map(normalizeRecipe) };
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

    const response = await apiClient.get<ApiRecipe[]>('/recipes', queryParams);
    return normalizeRecipes(response);
  },

  async getByProduct(productId: number): Promise<ApiResponse<ApiRecipe[]>> {
    const response = await apiClient.get<ApiRecipe[]>('/recipes', {
      'filters[product][id][$eq]': productId,
      'populate[0]': 'product',
      'populate[1]': 'image',
    });
    return normalizeRecipes(response);
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
