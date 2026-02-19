/**
 * CoffeePOS - Mock WriteOffs API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { WriteOff, WriteOffCreateData, GetWriteOffsParams } from '@/lib/api/writeoffs';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';
import { logActivity } from '../activity-logger';

export const mockWriteoffsApi = {
  async getAll(params: GetWriteOffsParams = {}): Promise<ApiResponse<WriteOff[]>> {
    await mockDelay();
    let items = [...getStore().writeoffs];

    if (params.type) {
      items = items.filter((w) => w.type === params.type);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wrapResponse(items, items.length);
  },

  async create(data: WriteOffCreateData): Promise<ApiResponse<WriteOff>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const writeoff: WriteOff = {
      id: store.getId(),
      documentId: generateDocumentId(),
      type: data.type,
      items: data.items,
      totalCost: data.totalCost,
      reason: data.reason,
      performedBy: data.performedBy,
      createdAt: now,
      updatedAt: now,
    };

    store.writeoffs.unshift(writeoff);

    // Deduct ingredient stock
    for (const item of data.items) {
      if (item.ingredientId) {
        const ing = store.ingredients.find((i) => i.id === item.ingredientId);
        if (ing) {
          ing.quantity = Math.max(0, ing.quantity - item.quantity);
          ing.updatedAt = now;
        }
      }
    }

    // Update shift counter
    if (store.currentShift) {
      store.currentShift.writeOffsTotal += data.totalCost;
    }

    logActivity('writeoff_create', {
      writeOffId: writeoff.id,
      type: writeoff.type,
      itemCount: writeoff.items.length,
      totalCost: writeoff.totalCost,
    });

    return wrapResponse(writeoff);
  },
};
