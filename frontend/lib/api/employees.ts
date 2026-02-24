/**
 * CoffeePOS - Employees API
 */

import { apiClient, type ApiResponse } from './client';

// ============================================
// TYPES
// ============================================

export type EmployeeRole = 'owner' | 'manager' | 'barista';

export interface Employee {
  id: number;
  documentId: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  position: string;
  isActive: boolean;
  hireDate: string;
  salary?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  name: string;
  email?: string;
  phone?: string;
  role: EmployeeRole;
  position?: string;
  isActive?: boolean;
  hireDate?: string;
  salary?: number;
  notes?: string;
}

export interface EmployeeStats {
  totalShifts: number;
  totalHours: number;
  totalOrders: number;
  totalSales: number;
  avgOrderValue: number;
  dailySales: { date: string; sales: number }[];
  dailyHours: { date: string; hours: number }[];
}

export interface EmployeePerformance {
  employeeId: number;
  employeeName: string;
  role: EmployeeRole;
  totalSales: number;
  totalHours: number;
  totalOrders: number;
  avgOrderValue: number;
  shiftsCount: number;
}

export interface GetEmployeesParams {
  role?: EmployeeRole;
  isActive?: boolean;
  search?: string;
}

// ============================================
// API METHODS
// ============================================

export const employeesApi = {
  async getAll(params: GetEmployeesParams = {}): Promise<ApiResponse<Employee[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[pageSize]': 100,
      'sort': 'name:asc',
    };

    if (params.role) {
      queryParams['filters[role][$eq]'] = params.role;
    }
    if (params.isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = params.isActive;
    }
    if (params.search) {
      queryParams['filters[$or][0][name][$containsi]'] = params.search;
      queryParams['filters[$or][1][email][$containsi]'] = params.search;
    }

    return apiClient.get<Employee[]>('/employees', queryParams);
  },

  async getById(documentId: string): Promise<ApiResponse<Employee>> {
    return apiClient.get<Employee>(`/employees/${documentId}`);
  },

  async create(data: EmployeeInput): Promise<ApiResponse<Employee>> {
    return apiClient.post<Employee>('/employees', { data });
  },

  async update(documentId: string, data: Partial<EmployeeInput>): Promise<ApiResponse<Employee>> {
    return apiClient.put<Employee>(`/employees/${documentId}`, { data });
  },

  async delete(documentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/employees/${documentId}`);
  },

  async getStats(
    documentId: string,
    params?: { month?: number; year?: number }
  ): Promise<ApiResponse<EmployeeStats>> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.month) queryParams.month = params.month;
    if (params?.year)  queryParams.year  = params.year;
    return apiClient.get<EmployeeStats>(`/employees/${documentId}/stats`, queryParams);
  },

  async getPerformance(
    params?: { month?: number; year?: number }
  ): Promise<ApiResponse<EmployeePerformance[]>> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.month) queryParams.month = params.month;
    if (params?.year)  queryParams.year  = params.year;
    return apiClient.get<EmployeePerformance[]>('/employees/performance', queryParams);
  },
};
