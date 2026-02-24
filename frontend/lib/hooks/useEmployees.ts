'use client';

/**
 * CoffeePOS - Employees Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeesApi,
  type GetEmployeesParams,
  type EmployeeInput,
} from '@/lib/api';

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: GetEmployeesParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  stats: (id: string, month?: number, year?: number) => [...employeeKeys.all, 'stats', id, month, year] as const,
  performance: (month?: number, year?: number) => [...employeeKeys.all, 'performance', month, year] as const,
};

export function useEmployees(params: GetEmployeesParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesApi.getAll(params),
    select: (data) => data.data,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useEmployeeStats(id: string, params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: employeeKeys.stats(id, params?.month, params?.year),
    queryFn: () => employeesApi.getStats(id, params),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useEmployeePerformance(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: employeeKeys.performance(params?.month, params?.year),
    queryFn: () => employeesApi.getPerformance(params),
    select: (data) => data.data,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmployeeInput) => employeesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.performance() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeInput> }) =>
      employeesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.performance() });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.performance() });
    },
  });
}
