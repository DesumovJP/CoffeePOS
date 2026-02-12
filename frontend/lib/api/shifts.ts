/**
 * ParadisePOS - Shifts API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export interface Shift {
  id: number;
  documentId: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingCash: number;
  closingCash: number;
  status: 'open' | 'closed';
  cashSales: number;
  cardSales: number;
  totalSales: number;
  ordersCount: number;
  writeOffsTotal: number;
  suppliesTotal: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftOpenData {
  openingCash: number;
  openedBy: string;
}

export interface ShiftCloseData {
  closingCash: number;
  closedBy: string;
  notes?: string;
}

export interface GetShiftsParams {
  page?: number;
  pageSize?: number;
  status?: 'open' | 'closed';
  sort?: string;
}

// ============================================
// API METHODS
// ============================================

export const shiftsApi = {
  async getCurrent(): Promise<ApiResponse<Shift | null>> {
    return apiClient.get<Shift | null>('/shifts/current');
  },

  async open(data: ShiftOpenData): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>('/shifts/open', { data });
  },

  async close(id: number, data: ShiftCloseData): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>(`/shifts/${id}/close`, { data });
  },

  async getAll(params: GetShiftsParams = {}): Promise<ApiResponse<Shift[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 50,
      'sort': params.sort || 'openedAt:desc',
    };

    if (params.status) {
      queryParams['filters[status][$eq]'] = params.status;
    }

    return apiClient.get<Shift[]>('/shifts', queryParams);
  },

  async getById(id: number): Promise<ApiResponse<Shift>> {
    return apiClient.get<Shift>(`/shifts/${id}`);
  },
};
