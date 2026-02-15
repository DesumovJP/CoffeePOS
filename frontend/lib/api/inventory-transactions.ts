/**
 * CoffeePOS - Inventory Transactions API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export type ApiTransactionType = 'sale' | 'supply' | 'writeoff' | 'adjustment';

export interface ApiInventoryTransaction {
  id: number;
  documentId: string;
  type: ApiTransactionType;
  ingredient?: { id: number; name: string };
  product?: { id: number; name: string };
  quantity: number;
  previousQty: number;
  newQty: number;
  reference?: string;
  performedBy?: string;
  shift?: { id: number };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTransactionsParams {
  page?: number;
  pageSize?: number;
  type?: ApiTransactionType;
  dateFrom?: string;
  dateTo?: string;
  shiftId?: number;
  sort?: string;
}

// ============================================
// API METHODS
// ============================================

export const apiInventoryTransactionsApi = {
  async getAll(params: GetTransactionsParams = {}): Promise<ApiResponse<ApiInventoryTransaction[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 100,
      'populate': 'ingredient,product,shift',
      'sort': params.sort || 'createdAt:desc',
    };

    if (params.type) {
      queryParams['filters[type][$eq]'] = params.type;
    }

    if (params.dateFrom) {
      queryParams['filters[createdAt][$gte]'] = params.dateFrom;
    }

    if (params.dateTo) {
      queryParams['filters[createdAt][$lte]'] = params.dateTo;
    }

    if (params.shiftId) {
      queryParams['filters[shift][id][$eq]'] = params.shiftId;
    }

    return apiClient.get<ApiInventoryTransaction[]>('/inventory-transactions', queryParams);
  },
};
