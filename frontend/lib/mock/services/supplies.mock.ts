/**
 * ParadisePOS - Mock Supplies API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { Supply, SupplyCreateData, SupplyStatus, GetSuppliesParams } from '@/lib/api/supplies';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';

export const mockSuppliesApi = {
  async getAll(params: GetSuppliesParams = {}): Promise<ApiResponse<Supply[]>> {
    await mockDelay();
    let items = [...getStore().supplies];

    if (params.status) {
      items = items.filter((s) => s.status === params.status);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wrapResponse(items, items.length);
  },

  async create(data: SupplyCreateData): Promise<ApiResponse<Supply>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const supply: Supply = {
      id: store.getId(),
      documentId: generateDocumentId(),
      supplierName: data.supplierName,
      status: 'draft',
      items: data.items,
      totalCost: data.totalCost,
      notes: data.notes,
      createdBy_barista: data.createdBy_barista,
      createdAt: now,
      updatedAt: now,
    };

    store.supplies.unshift(supply);
    return wrapResponse(supply);
  },

  async update(
    id: number,
    data: Partial<SupplyCreateData & { status: SupplyStatus }>
  ): Promise<ApiResponse<Supply>> {
    await mockDelay();
    const store = getStore();
    const idx = store.supplies.findIndex((s) => s.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Supply not found' };

    store.supplies[idx] = { ...store.supplies[idx], ...data, updatedAt: nowISO() } as Supply;
    return wrapResponse(store.supplies[idx]);
  },

  async receive(id: number, receivedBy: string): Promise<ApiResponse<Supply>> {
    await mockDelay();
    const store = getStore();
    const idx = store.supplies.findIndex((s) => s.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Supply not found' };

    const now = nowISO();
    store.supplies[idx] = {
      ...store.supplies[idx],
      status: 'received',
      receivedAt: now,
      receivedBy,
      updatedAt: now,
    };

    // Update ingredient stock
    for (const item of store.supplies[idx].items) {
      const ing = store.ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        ing.quantity += item.quantity;
        ing.updatedAt = now;
      }
    }

    return wrapResponse(store.supplies[idx]);
  },

  async cancel(id: number): Promise<ApiResponse<Supply>> {
    await mockDelay();
    const store = getStore();
    const idx = store.supplies.findIndex((s) => s.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Supply not found' };

    store.supplies[idx] = { ...store.supplies[idx], status: 'cancelled', updatedAt: nowISO() };
    return wrapResponse(store.supplies[idx]);
  },
};
