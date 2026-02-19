/**
 * CoffeePOS - Categories API
 *
 * API methods for category management
 */

import { apiClient, type ApiResponse } from './client';
import type { Category, CategoryInput } from './types';

// ============================================
// TYPES
// ============================================

export interface GetCategoriesParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  sort?: string;
  populate?: string;
}

// ============================================
// API METHODS
// ============================================

export const categoriesApi = {
  /**
   * Get all categories
   */
  async getAll(params: GetCategoriesParams = {}): Promise<ApiResponse<Category[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 100,
      'populate': params.populate || 'image,parentCategory',
      'sort': params.sort || 'sortOrder:asc,name:asc',
    };

    if (params.isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = params.isActive;
    }

    return apiClient.get<Category[]>('/categories', queryParams);
  },

  /**
   * Get active categories (for POS)
   */
  async getActive(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories', {
      'filters[isActive][$eq]': true,
      'sort': 'sortOrder:asc,name:asc',
      'populate': 'image',
    });
  },

  /**
   * Get a single category by ID
   */
  async getById(documentId: string): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`/categories/${documentId}`, {
      populate: 'image,products,parentCategory',
    });
  },

  /**
   * Get a single category by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories', {
      'filters[slug][$eq]': slug,
      'populate': 'image,products,parentCategory',
    });
  },

  /**
   * Create a new category
   */
  async create(data: CategoryInput): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('/categories', { data });
  },

  /**
   * Update a category
   */
  async update(documentId: string, data: Partial<CategoryInput>): Promise<ApiResponse<Category>> {
    return apiClient.put<Category>(`/categories/${documentId}`, { data });
  },

  /**
   * Delete a category
   */
  async delete(documentId: string): Promise<ApiResponse<Category>> {
    return apiClient.delete<Category>(`/categories/${documentId}`);
  },

  /**
   * Reorder categories
   */
  async reorder(orderedDocumentIds: string[]): Promise<void> {
    await Promise.all(
      orderedDocumentIds.map((documentId, index) =>
        apiClient.put(`/categories/${documentId}`, { data: { sortOrder: index } })
      )
    );
  },
};
