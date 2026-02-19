/**
 * CoffeePOS - Activities API
 */

import { apiClient } from './client';
import type { ShiftActivity, ShiftActivityType } from './reports';

export interface GetActivitiesParams {
  dateFrom?: string;
  dateTo?: string;
  types?: ShiftActivityType[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivitiesResponse {
  data: ShiftActivity[];
  total: number;
}

export const activitiesApi = {
  async getAll(params: GetActivitiesParams = {}): Promise<ActivitiesResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      types: params.types?.join(','),
      search: params.search,
      limit: params.limit,
      offset: params.offset,
    };
    return apiClient.get<ActivitiesResponse>('/activities', queryParams) as unknown as ActivitiesResponse;
  },
};
