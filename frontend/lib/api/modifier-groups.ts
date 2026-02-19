/**
 * CoffeePOS - Modifier Groups API
 *
 * API methods for modifier group and modifier management
 */

import { apiClient, type ApiResponse } from './client';
import type { ModifierGroup, ModifierGroupInput, Modifier, ModifierInput } from './types';

// ============================================
// TYPES
// ============================================

export interface GetModifierGroupsParams {
  isActive?: boolean;
  sort?: string;
}

// ============================================
// MODIFIER GROUPS API
// ============================================

export const modifierGroupsApi = {
  /**
   * Get all modifier groups
   */
  async getAll(params: GetModifierGroupsParams = {}): Promise<ApiResponse<ModifierGroup[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'populate': 'modifiers',
      'pagination[pageSize]': 200,
      'sort': params.sort || 'sortOrder:asc',
    };

    if (params.isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = params.isActive;
    }

    return apiClient.get<ModifierGroup[]>('/modifier-groups', queryParams);
  },

  /**
   * Get a single modifier group by ID
   */
  async getById(documentId: string): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.get<ModifierGroup>(`/modifier-groups/${documentId}`, {
      'populate': 'modifiers',
    });
  },

  /**
   * Create a new modifier group
   */
  async create(data: ModifierGroupInput): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.post<ModifierGroup>('/modifier-groups', { data });
  },

  /**
   * Update a modifier group
   */
  async update(documentId: string, data: Partial<ModifierGroupInput>): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.put<ModifierGroup>(`/modifier-groups/${documentId}`, { data });
  },

  /**
   * Delete a modifier group
   */
  async delete(documentId: string): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.delete<ModifierGroup>(`/modifier-groups/${documentId}`);
  },
};

// ============================================
// MODIFIERS API
// ============================================

export const modifiersApi = {
  /**
   * Create a new modifier
   */
  async create(data: ModifierInput): Promise<ApiResponse<Modifier>> {
    return apiClient.post<Modifier>('/modifiers', { data });
  },

  /**
   * Update a modifier
   */
  async update(documentId: string, data: Partial<ModifierInput>): Promise<ApiResponse<Modifier>> {
    return apiClient.put<Modifier>(`/modifiers/${documentId}`, { data });
  },

  /**
   * Delete a modifier
   */
  async delete(documentId: string): Promise<ApiResponse<Modifier>> {
    return apiClient.delete<Modifier>(`/modifiers/${documentId}`);
  },
};
