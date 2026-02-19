'use client';

/**
 * CoffeePOS - Activities Hook
 */

import { useQuery } from '@tanstack/react-query';
import { activitiesApi, type GetActivitiesParams } from '@/lib/api';

export const activityKeys = {
  all: ['activities'] as const,
  list: (params: GetActivitiesParams) => [...activityKeys.all, 'list', params] as const,
};

export function useActivities(params: GetActivitiesParams = {}) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => activitiesApi.getAll(params),
    select: (resp) => resp,
  });
}
