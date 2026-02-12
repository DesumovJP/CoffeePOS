/**
 * ParadisePOS - Write-offs API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export type WriteOffType = 'expired' | 'damaged' | 'other';

export interface WriteOffItem {
  ingredientId?: number;
  ingredientName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface WriteOff {
  id: number;
  documentId: string;
  type: WriteOffType;
  items: WriteOffItem[];
  totalCost: number;
  reason?: string;
  performedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WriteOffCreateData {
  type: WriteOffType;
  items: WriteOffItem[];
  totalCost: number;
  reason?: string;
  performedBy?: string;
}

export interface GetWriteOffsParams {
  page?: number;
  pageSize?: number;
  type?: WriteOffType;
  sort?: string;
}

// ============================================
// API METHODS
// ============================================

export const writeoffsApi = {
  async getAll(params: GetWriteOffsParams = {}): Promise<ApiResponse<WriteOff[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 50,
      'sort': params.sort || 'createdAt:desc',
    };

    if (params.type) {
      queryParams['filters[type][$eq]'] = params.type;
    }

    return apiClient.get<WriteOff[]>('/write-offs', queryParams);
  },

  async create(data: WriteOffCreateData): Promise<ApiResponse<WriteOff>> {
    return apiClient.post<WriteOff>('/write-offs', { data });
  },
};
