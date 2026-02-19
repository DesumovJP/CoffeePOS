/**
 * CoffeePOS - Ingredients API
 *
 * API services for managing ingredients and inventory
 */

import { apiClient, type ApiResponse } from './client';
import type {
  Ingredient,
  IngredientInput,
  IngredientCategory,
  IngredientCategoryInput,
  InventoryTransaction,
  InventoryTransactionInput,
} from './types';

// ============================================
// PARAMS
// ============================================

export interface GetIngredientsParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  isLowStock?: boolean;
  sortBy?: 'name' | 'quantity' | 'costPerUnit' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface GetIngredientCategoriesParams {
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetInventoryTransactionsParams {
  ingredientId?: number;
  productId?: number;
  type?: InventoryTransaction['type'];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// INGREDIENTS API
// ============================================

export const ingredientsApi = {
  /**
   * Get all ingredients with optional filtering
   */
  async getAll(params?: GetIngredientsParams): Promise<ApiResponse<Ingredient[]>> {
    const query = new URLSearchParams();

    if (params?.search) {
      query.append('filters[name][$containsi]', params.search);
    }
    if (params?.category) {
      query.append('filters[category][slug][$eq]', params.category);
    }
    if (params?.isActive !== undefined) {
      query.append('filters[isActive][$eq]', String(params.isActive));
    }
    if (params?.isLowStock) {
      // Low stock = quantity <= minQuantity
      query.append('filters[$expr][$lte]', '[$quantity, $minQuantity]');
    }

    // Sorting
    const sortField = params?.sortBy || 'name';
    const sortDir = params?.sortOrder || 'asc';
    query.append('sort', `${sortField}:${sortDir}`);

    // Pagination
    if (params?.page) {
      query.append('pagination[page]', String(params.page));
    }
    if (params?.pageSize) {
      query.append('pagination[pageSize]', String(params.pageSize));
    }

    // Populate relations
    query.append('populate', 'category,image');

    const queryString = query.toString();
    return apiClient.get<Ingredient[]>(`/ingredients${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get single ingredient by ID
   */
  async getById(documentId: string): Promise<ApiResponse<Ingredient>> {
    return apiClient.get<Ingredient>(`/ingredients/${documentId}?populate=category,image`);
  },

  /**
   * Create new ingredient
   */
  async create(data: IngredientInput): Promise<ApiResponse<Ingredient>> {
    return apiClient.post<Ingredient>('/ingredients', { data });
  },

  /**
   * Update ingredient
   */
  async update(documentId: string, data: Partial<IngredientInput>): Promise<ApiResponse<Ingredient>> {
    return apiClient.put<Ingredient>(`/ingredients/${documentId}`, { data });
  },

  /**
   * Delete ingredient
   */
  async delete(documentId: string): Promise<ApiResponse<Ingredient>> {
    return apiClient.delete<Ingredient>(`/ingredients/${documentId}`);
  },

  /**
   * Adjust ingredient quantity (quick stock update)
   */
  async adjustQuantity(
    documentId: string,
    adjustment: number,
    type: InventoryTransaction['type'] = 'adjustment',
    notes?: string
  ): Promise<ApiResponse<Ingredient>> {
    return apiClient.post<Ingredient>(`/ingredients/${documentId}/adjust`, {
      adjustment,
      type,
      notes,
    });
  },

  /**
   * Get low stock ingredients
   */
  async getLowStock(): Promise<ApiResponse<Ingredient[]>> {
    return this.getAll({ isLowStock: true, isActive: true });
  },
};

// ============================================
// INGREDIENT CATEGORIES API
// ============================================

export const ingredientCategoriesApi = {
  /**
   * Get all ingredient categories
   */
  async getAll(params?: GetIngredientCategoriesParams): Promise<ApiResponse<IngredientCategory[]>> {
    const query = new URLSearchParams();

    if (params?.isActive !== undefined) {
      query.append('filters[isActive][$eq]', String(params.isActive));
    }

    const sortField = params?.sortBy || 'sortOrder';
    const sortDir = params?.sortOrder || 'asc';
    query.append('sort', `${sortField}:${sortDir}`);

    const queryString = query.toString();
    return apiClient.get<IngredientCategory[]>(
      `/ingredient-categories${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get single category by ID
   */
  async getById(documentId: string): Promise<ApiResponse<IngredientCategory>> {
    return apiClient.get<IngredientCategory>(`/ingredient-categories/${documentId}?populate=ingredients`);
  },

  /**
   * Create new category
   */
  async create(data: IngredientCategoryInput): Promise<ApiResponse<IngredientCategory>> {
    return apiClient.post<IngredientCategory>('/ingredient-categories', { data });
  },

  /**
   * Update category
   */
  async update(
    documentId: string,
    data: Partial<IngredientCategoryInput>
  ): Promise<ApiResponse<IngredientCategory>> {
    return apiClient.put<IngredientCategory>(`/ingredient-categories/${documentId}`, { data });
  },

  /**
   * Delete category
   */
  async delete(documentId: string): Promise<ApiResponse<IngredientCategory>> {
    return apiClient.delete<IngredientCategory>(`/ingredient-categories/${documentId}`);
  },
};

// ============================================
// INVENTORY TRANSACTIONS API
// ============================================

export const inventoryTransactionsApi = {
  /**
   * Get all transactions with optional filtering
   */
  async getAll(
    params?: GetInventoryTransactionsParams
  ): Promise<ApiResponse<InventoryTransaction[]>> {
    const query = new URLSearchParams();

    if (params?.ingredientId) {
      query.append('filters[ingredient][id][$eq]', String(params.ingredientId));
    }
    if (params?.productId) {
      query.append('filters[product][id][$eq]', String(params.productId));
    }
    if (params?.type) {
      query.append('filters[type][$eq]', params.type);
    }
    if (params?.startDate) {
      query.append('filters[createdAt][$gte]', params.startDate);
    }
    if (params?.endDate) {
      query.append('filters[createdAt][$lte]', params.endDate);
    }

    query.append('sort', 'createdAt:desc');

    if (params?.page) {
      query.append('pagination[page]', String(params.page));
    }
    if (params?.pageSize) {
      query.append('pagination[pageSize]', String(params.pageSize));
    }

    query.append('populate', 'ingredient,product');

    const queryString = query.toString();
    return apiClient.get<InventoryTransaction[]>(
      `/inventory-transactions${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Create new transaction
   */
  async create(data: InventoryTransactionInput): Promise<ApiResponse<InventoryTransaction>> {
    return apiClient.post<InventoryTransaction>('/inventory-transactions', { data });
  },
};
