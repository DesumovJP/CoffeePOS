'use client';

/**
 * ParadisePOS - Orders Hooks
 *
 * React Query hooks for orders data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type GetOrdersParams } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/api';

// ============================================
// QUERY KEYS
// ============================================

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: GetOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  active: () => [...orderKeys.all, 'active'] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Hook to fetch orders with optional filtering
 */
export function useOrders(params: GetOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.getAll(params),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

/**
 * Hook to fetch active orders (pending, confirmed, preparing, ready)
 */
export function useActiveOrders() {
  return useQuery({
    queryKey: orderKeys.active(),
    queryFn: () => ordersApi.getActive(),
    select: (data) => data.data,
    refetchInterval: 15000,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
    },
  });
}
