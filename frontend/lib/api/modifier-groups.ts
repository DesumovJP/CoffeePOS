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
  async getById(id: number): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.get<ModifierGroup>(`/modifier-groups/${id}`, {
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
  async update(id: number, data: Partial<ModifierGroupInput>): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.put<ModifierGroup>(`/modifier-groups/${id}`, { data });
  },

  /**
   * Delete a modifier group
   */
  async delete(id: number): Promise<ApiResponse<ModifierGroup>> {
    return apiClient.delete<ModifierGroup>(`/modifier-groups/${id}`);
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
  async update(id: number, data: Partial<ModifierInput>): Promise<ApiResponse<Modifier>> {
    return apiClient.put<Modifier>(`/modifiers/${id}`, { data });
  },

  /**
   * Delete a modifier
   */
  async delete(id: number): Promise<ApiResponse<Modifier>> {
    return apiClient.delete<Modifier>(`/modifiers/${id}`);
  },
};
