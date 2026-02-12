/**
 * ParadisePOS - Products API
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
      'populate': params.populate || 'image,category,modifierGroups.modifiers',
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

    return apiClient.get<Product[]>('/products', queryParams);
  },

  /**
   * Get a single product by ID
   */
  async getById(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${id}`, {
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
  async update(id: number, data: Partial<ProductInput>): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${id}`, { data });
  },

  /**
   * Delete a product
   */
  async delete(id: number): Promise<ApiResponse<Product>> {
    return apiClient.delete<Product>(`/products/${id}`);
  },

  /**
   * Update product stock quantity
   */
  async updateStock(id: number, quantity: number): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${id}`, {
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
