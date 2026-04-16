/**
 * CoffeePOS - Products API
 *
 * API methods for product management
 */

import { apiClient, type ApiResponse } from './client';
import type { Product, ProductInput } from './types';

// ============================================
// TYPES
// ============================================

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  /** Filter by inventoryType. Pass 'not_recipe' to exclude recipe-based products. */
  inventoryType?: 'none' | 'simple' | 'recipe' | 'not_recipe';
  sort?: string;
  populate?: string;
}

// ============================================
// API METHODS
// ============================================

export const productsApi = {
  /**
   * Get all products with optional filtering
   */
  async getAll(params: GetProductsParams = {}): Promise<ApiResponse<Product[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 100,
      'populate': params.populate || 'image,category',
      'sort': params.sort || 'sortOrder:asc,name:asc',
    };

    // Filters
    if (params.category) {
      queryParams['filters[category][slug][$eq]'] = params.category;
    }

    if (params.search) {
      queryParams['filters[name][$containsi]'] = params.search;
    }

    if (params.isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = params.isActive;
    }

    if (params.isFeatured !== undefined) {
      queryParams['filters[isFeatured][$eq]'] = params.isFeatured;
    }

    // inventoryType filter — 'not_recipe' excludes recipe-based products at the API level.
    // Uses $or to also include products where inventoryType is null (not yet migrated).
    // If backend doesn't support the field yet (400), retries without the filter.
    const inventoryFilter = params.inventoryType;
    if (inventoryFilter === 'not_recipe') {
      queryParams['filters[$or][0][inventoryType][$ne]'] = 'recipe';
      queryParams['filters[$or][1][inventoryType][$null]'] = true;
    } else if (inventoryFilter) {
      queryParams['filters[inventoryType][$eq]'] = inventoryFilter;
    }

    try {
      return await apiClient.get<Product[]>('/products', queryParams);
    } catch (err: any) {
      // Backend doesn't support inventoryType yet — retry without filter
      if (inventoryFilter && err?.status === 400) {
        delete queryParams['filters[$or][0][inventoryType][$ne]'];
        delete queryParams['filters[$or][1][inventoryType][$null]'];
        delete queryParams['filters[inventoryType][$eq]'];
        return apiClient.get<Product[]>('/products', queryParams);
      }
      throw err;
    }
  },

  /**
   * Get a single product by ID
   */
  async getById(documentId: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${documentId}`, {
      populate: 'image,gallery,category,modifierGroups.modifiers',
    });
  },

  /**
   * Get a single product by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products', {
      'filters[slug][$eq]': slug,
      'populate': 'image,gallery,category,modifierGroups.modifiers',
    });
  },

  /**
   * Create a new product
   */
  async create(data: ProductInput): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/products', { data });
  },

  /**
   * Update a product
   */
  async update(documentId: string, data: Partial<ProductInput>): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${documentId}`, { data });
  },

  /**
   * Delete a product
   */
  async delete(documentId: string): Promise<ApiResponse<Product>> {
    return apiClient.delete<Product>(`/products/${documentId}`);
  },

  /**
   * Update product stock quantity
   */
  async updateStock(documentId: string, quantity: number): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${documentId}`, {
      data: { stockQuantity: quantity },
    });
  },

  /**
   * Get low stock products
   * Note: This fetches all tracked products and filters client-side
   * as Strapi doesn't support $expr comparisons between fields
   */
  async getLowStock(): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<Product[]>('/products', {
      'filters[trackInventory][$eq]': true,
      'filters[isActive][$eq]': true,
      'populate': 'image,category',
    });

    // Filter products where stockQuantity <= lowStockThreshold
    const lowStockProducts = response.data.filter(
      (product) => product.stockQuantity <= product.lowStockThreshold
    );

    return {
      ...response,
      data: lowStockProducts,
    };
  },

  /**
   * Get featured products
   */
  async getFeatured(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products', {
      'filters[isFeatured][$eq]': true,
      'filters[isActive][$eq]': true,
      'populate': 'image,category',
      'pagination[pageSize]': 10,
    });
  },
};
