'use client';

/**
 * ParadisePOS - Reports Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

export const reportKeys = {
  all: ['reports'] as const,
  daily: (date: string) => [...reportKeys.all, 'daily', date] as const,
  monthly: (year: number, month: number) => [...reportKeys.all, 'monthly', year, month] as const,
};

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: reportKeys.daily(date),
    queryFn: () => reportsApi.getDaily(date),
    select: (data) => data.data,
    enabled: !!date,
  });
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: reportKeys.monthly(year, month),
    queryFn: () => reportsApi.getMonthly(year, month),
    select: (data) => data.data,
    enabled: !!year && !!month,
  });
}
