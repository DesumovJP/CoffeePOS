/**
 * ParadisePOS - Supplies API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export type SupplyStatus = 'draft' | 'ordered' | 'shipped' | 'received' | 'cancelled';

export interface SupplyItem {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Supply {
  id: number;
  documentId: string;
  supplierName: string;
  status: SupplyStatus;
  items: SupplyItem[];
  totalCost: number;
  notes?: string;
  orderedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
  createdBy_barista?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyCreateData {
  supplierName: string;
  items: SupplyItem[];
  totalCost: number;
  notes?: string;
  createdBy_barista?: string;
}

export interface GetSuppliesParams {
  page?: number;
  pageSize?: number;
  status?: SupplyStatus;
  sort?: string;
}

// ============================================
// API METHODS
// ============================================

export const suppliesApi = {
  async getAll(params: GetSuppliesParams = {}): Promise<ApiResponse<Supply[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 50,
      'sort': params.sort || 'createdAt:desc',
    };

    if (params.status) {
      queryParams['filters[status][$eq]'] = params.status;
    }

    return apiClient.get<Supply[]>('/supplies', queryParams);
  },

  async create(data: SupplyCreateData): Promise<ApiResponse<Supply>> {
    return apiClient.post<Supply>('/supplies', { data });
  },

  async update(id: number, data: Partial<SupplyCreateData & { status: SupplyStatus }>): Promise<ApiResponse<Supply>> {
    return apiClient.put<Supply>(`/supplies/${id}`, { data });
  },

  async receive(id: number, receivedBy: string): Promise<ApiResponse<Supply>> {
    return apiClient.post<Supply>(`/supplies/${id}/receive`, { data: { receivedBy } });
  },

  async cancel(id: number): Promise<ApiResponse<Supply>> {
    return apiClient.put<Supply>(`/supplies/${id}`, { data: { status: 'cancelled' } });
  },
};
