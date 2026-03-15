'use client';

/**
 * CoffeePOS - Suppliers Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi, type SupplierCreateData } from '@/lib/api';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params?: object) => [...supplierKeys.lists(), params] as const,
};

export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: () => suppliersApi.getAll(),
    select: (data) => data.data,
    // Suppliers change infrequently — cache for 5 minutes.
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupplierCreateData) => suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierCreateData> }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}
