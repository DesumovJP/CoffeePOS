/**
 * CoffeePOS - Mock Activities API
 */

import type { GetActivitiesParams, ActivitiesResponse } from '@/lib/api/activities';
import { getStore } from '../store';
import { mockDelay } from '../helpers';

export const mockActivitiesApi = {
  async getAll(params: GetActivitiesParams = {}): Promise<ActivitiesResponse> {
    await mockDelay();
    const store = getStore();
    let items = [...store.activities];

    // Filter by date range
    if (params.dateFrom) {
      const from = new Date(params.dateFrom).getTime();
      items = items.filter((a) => new Date(a.timestamp).getTime() >= from);
    }
    if (params.dateTo) {
      const to = new Date(params.dateTo).getTime();
      items = items.filter((a) => new Date(a.timestamp).getTime() <= to);
    }

    // Filter by activity types
    if (params.types && params.types.length > 0) {
      items = items.filter((a) => params.types!.includes(a.type));
    }

    // Search across details
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((a) => {
        const details = JSON.stringify(a.details).toLowerCase();
        return details.includes(q) || a.type.includes(q);
      });
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = items.length;

    // Pagination
    if (params.offset) {
      items = items.slice(params.offset);
    }
    if (params.limit) {
      items = items.slice(0, params.limit);
    }

    return { data: items, total };
  },
};
