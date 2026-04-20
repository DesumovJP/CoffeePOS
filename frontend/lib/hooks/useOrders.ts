'use client';

/**
 * CoffeePOS - Orders Hooks
 *
 * React Query hooks for orders data
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ordersApi, type GetOrdersParams } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/api';
import { productKeys } from './useProducts';

// ============================================
// QUERY KEYS
// ============================================

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: GetOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
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
    // Orders are POS real-time data — always consider stale so new orders appear immediately
    staleTime: 0,
    // Keep showing previous data while new query loads (prevents spinner flash on
    // Zustand persist hydration, which changes the dateRange query key)
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string) {
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
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    meta: { toast: { success: 'Статус замовлення оновлено', error: 'Не вдалось оновити статус' } },
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      // Cancellation refunds inventory on the server — refresh POS availability
      if (status === 'cancelled') {
        queryClient.invalidateQueries({ queryKey: productKeys.availability() });
      }
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    meta: { toast: { success: 'Замовлення скасовано', error: 'Не вдалось скасувати замовлення' } },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: productKeys.availability() });
    },
  });
}
