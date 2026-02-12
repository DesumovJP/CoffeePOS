/**
 * ParadisePOS - Mock Tables API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { CafeTable, CafeTableInput } from '@/lib/api/types';
import type { GetTablesParams } from '@/lib/api/tables';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';

export const mockTablesApi = {
  async getAll(params: GetTablesParams = {}): Promise<ApiResponse<CafeTable[]>> {
    await mockDelay();
    let items = [...getStore().tables];

    if (params.isActive !== undefined) {
      items = items.filter((t) => t.isActive === params.isActive);
    }

    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<CafeTable>> {
    await mockDelay();
    const table = getStore().tables.find((t) => t.id === id);
    if (!table) throw { status: 404, name: 'NotFoundError', message: 'Table not found' };
    return wrapResponse(table);
  },

  async create(data: CafeTableInput): Promise<ApiResponse<CafeTable>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const table: CafeTable = {
      id: store.getId(),
      documentId: generateDocumentId(),
      number: data.number,
      seats: data.seats,
      zone: data.zone,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? store.tables.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    store.tables.push(table);
    return wrapResponse(table);
  },

  async update(id: number, data: Partial<CafeTableInput>): Promise<ApiResponse<CafeTable>> {
    await mockDelay();
    const store = getStore();
    const idx = store.tables.findIndex((t) => t.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Table not found' };

    store.tables[idx] = { ...store.tables[idx], ...data, updatedAt: nowISO() } as CafeTable;
    return wrapResponse(store.tables[idx]);
  },
};
