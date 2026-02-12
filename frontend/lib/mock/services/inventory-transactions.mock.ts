/**
 * ParadisePOS - Mock Inventory Transactions API (inventory-transactions.ts module)
 */

import type { ApiResponse } from '@/lib/api/client';
import type { ApiInventoryTransaction, GetTransactionsParams } from '@/lib/api/inventory-transactions';
import { getStore } from '../store';
import { mockDelay, wrapResponse } from '../helpers';

export const mockApiInventoryTransactionsApi = {
  async getAll(params: GetTransactionsParams = {}): Promise<ApiResponse<ApiInventoryTransaction[]>> {
    await mockDelay();
    let items = [...getStore().transactions];

    if (params.type) {
      items = items.filter((t) => t.type === params.type);
    }
    if (params.dateFrom) {
      items = items.filter((t) => t.createdAt >= params.dateFrom!);
    }
    if (params.dateTo) {
      items = items.filter((t) => t.createdAt <= params.dateTo!);
    }
    if (params.shiftId) {
      items = items.filter((t) => t.shift?.id === params.shiftId);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wrapResponse(items, items.length);
  },
};
