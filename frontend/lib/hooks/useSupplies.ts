'use client';

/**
 * CoffeePOS - Supplies Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliesApi, type GetSuppliesParams, type SupplyCreateData } from '@/lib/api';

export const supplyKeys = {
  all: ['supplies'] as const,
  lists: () => [...supplyKeys.all, 'list'] as const,
  list: (params: GetSuppliesParams) => [...supplyKeys.lists(), params] as const,
};

export function useSupplies(params: GetSuppliesParams = {}) {
  return useQuery({
    queryKey: supplyKeys.list(params),
    queryFn: () => suppliesApi.getAll(params),
    select: (data) => data.data,
  });
}

export function useCreateSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupplyCreateData) => suppliesApi.create(data),
    meta: { toast: { success: 'Поставку створено', error: 'Не вдалось створити поставку' } },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() });
    },
  });
}

export function useReceiveSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, receivedBy }: { id: string; receivedBy: string }) =>
      suppliesApi.receive(id, receivedBy),
    meta: { toast: { success: 'Поставку отримано', error: 'Не вдалось прийняти поставку' } },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() });
    },
  });
}

export function useCancelSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suppliesApi.cancel(id),
    meta: { toast: { success: 'Поставку скасовано', error: 'Не вдалось скасувати поставку' } },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() });
    },
  });
}
