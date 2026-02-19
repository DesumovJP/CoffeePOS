/**
 * CoffeePOS - Tables API
 *
 * API methods for cafe table management
 */

import { apiClient, type ApiResponse } from './client';
import type { CafeTable, CafeTableInput } from './types';

// ============================================
// TYPES
// ============================================

export interface GetTablesParams {
  isActive?: boolean;
  sort?: string;
}

// ============================================
// API METHODS
// ============================================

export const tablesApi = {
  /**
   * Get all tables
   */
  async getAll(params: GetTablesParams = {}): Promise<ApiResponse<CafeTable[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[pageSize]': 100,
      'sort': params.sort || 'sortOrder:asc',
    };

    if (params.isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = params.isActive;
    }

    return apiClient.get<CafeTable[]>('/cafe-tables', queryParams);
  },

  /**
   * Get a single table by ID
   */
  async getById(documentId: string): Promise<ApiResponse<CafeTable>> {
    return apiClient.get<CafeTable>(`/cafe-tables/${documentId}`);
  },

  /**
   * Create a new table
   */
  async create(data: CafeTableInput): Promise<ApiResponse<CafeTable>> {
    return apiClient.post<CafeTable>('/cafe-tables', { data });
  },

  /**
   * Update a table
   */
  async update(documentId: string, data: Partial<CafeTableInput>): Promise<ApiResponse<CafeTable>> {
    return apiClient.put<CafeTable>(`/cafe-tables/${documentId}`, { data });
  },

  /**
   * Delete a table
   */
  async delete(documentId: string): Promise<ApiResponse<CafeTable>> {
    return apiClient.delete<CafeTable>(`/cafe-tables/${documentId}`);
  },
};
