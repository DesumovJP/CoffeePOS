/**
 * CoffeePOS - Suppliers API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export interface Supplier {
  id: number;
  documentId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  website?: string;
  address?: string;
  category?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  reorderEveryDays?: number;
  minimumOrderAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreateData {
  name: string;
  contactPerson?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  website?: string;
  address?: string;
  category?: string;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
  reorderEveryDays?: number;
  minimumOrderAmount?: number;
}

// ============================================
// API METHODS
// ============================================

export const suppliersApi = {
  async getAll(): Promise<ApiResponse<Supplier[]>> {
    return apiClient.get<Supplier[]>('/suppliers', {
      'pagination[pageSize]': 200,
      'sort': 'name:asc',
      'filters[isActive][$eq]': true,
    });
  },

  async getAllIncludingInactive(): Promise<ApiResponse<Supplier[]>> {
    return apiClient.get<Supplier[]>('/suppliers', {
      'pagination[pageSize]': 200,
      'sort': 'name:asc',
    });
  },

  async create(data: SupplierCreateData): Promise<ApiResponse<Supplier>> {
    return apiClient.post<Supplier>('/suppliers', { data });
  },

  async update(documentId: string, data: Partial<SupplierCreateData>): Promise<ApiResponse<Supplier>> {
    return apiClient.put<Supplier>(`/suppliers/${documentId}`, { data });
  },

  async delete(documentId: string): Promise<ApiResponse<Supplier>> {
    return apiClient.delete<Supplier>(`/suppliers/${documentId}`);
  },
};
