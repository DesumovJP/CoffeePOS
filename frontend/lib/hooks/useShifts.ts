'use client';

/**
 * CoffeePOS - Shifts Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi, type GetShiftsParams, type ShiftOpenData, type ShiftCloseData } from '@/lib/api';

export const shiftKeys = {
  all: ['shifts'] as const,
  lists: () => [...shiftKeys.all, 'list'] as const,
  list: (params: GetShiftsParams) => [...shiftKeys.lists(), params] as const,
  details: () => [...shiftKeys.all, 'detail'] as const,
  detail: (id: number) => [...shiftKeys.details(), id] as const,
  current: () => [...shiftKeys.all, 'current'] as const,
};

export function useCurrentShift() {
  return useQuery({
    queryKey: shiftKeys.current(),
    queryFn: () => shiftsApi.getCurrent(),
    select: (data) => data.data,
    refetchInterval: 60000,
  });
}

export function useShifts(params: GetShiftsParams = {}) {
  return useQuery({
    queryKey: shiftKeys.list(params),
    queryFn: () => shiftsApi.getAll(params),
    select: (data) => data.data,
  });
}

export function useShift(id: number) {
  return useQuery({
    queryKey: shiftKeys.detail(id),
    queryFn: () => shiftsApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShiftOpenData) => shiftsApi.open(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.current() });
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShiftCloseData }) => shiftsApi.close(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.current() });
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
    },
  });
}
