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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() });
    },
  });
}

export function useReceiveSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, receivedBy }: { id: number; receivedBy: string }) =>
      suppliesApi.receive(id, receivedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() });
    },
  });
}

export function useCancelSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => suppliesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() });
    },
  });
}
