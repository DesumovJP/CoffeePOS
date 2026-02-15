'use client';

/**
 * CoffeePOS - Reports Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

export const reportKeys = {
  all: ['reports'] as const,
  daily: (date: string) => [...reportKeys.all, 'daily', date] as const,
  monthly: (year: number, month: number) => [...reportKeys.all, 'monthly', year, month] as const,
  products: (from: string, to: string) => [...reportKeys.all, 'products', from, to] as const,
  xReport: (shiftId: string) => [...reportKeys.all, 'x-report', shiftId] as const,
  zReport: (shiftId: string) => [...reportKeys.all, 'z-report', shiftId] as const,
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

export function useProductsReport(from: string, to: string) {
  return useQuery({
    queryKey: reportKeys.products(from, to),
    queryFn: () => reportsApi.getProducts(from, to),
    select: (data) => data.data,
    enabled: !!from && !!to,
  });
}

export function useXReport(shiftId: string) {
  return useQuery({
    queryKey: reportKeys.xReport(shiftId),
    queryFn: () => reportsApi.getXReport(shiftId),
    select: (data) => data.data,
    enabled: !!shiftId,
  });
}

export function useZReport(shiftId: string) {
  return useQuery({
    queryKey: reportKeys.zReport(shiftId),
    queryFn: () => reportsApi.getZReport(shiftId),
    select: (data) => data.data,
    enabled: !!shiftId,
  });
}
