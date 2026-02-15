/**
 * CoffeePOS - Mock Shifts API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { Shift, ShiftOpenData, ShiftCloseData, GetShiftsParams } from '@/lib/api/shifts';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';

export const mockShiftsApi = {
  async getCurrent(): Promise<ApiResponse<Shift | null>> {
    await mockDelay();
    return wrapResponse(getStore().currentShift);
  },

  async open(data: ShiftOpenData): Promise<ApiResponse<Shift>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const shift: Shift = {
      id: store.getId(),
      documentId: generateDocumentId(),
      openedAt: now,
      openedBy: data.openedBy,
      openingCash: data.openingCash,
      closingCash: 0,
      status: 'open',
      cashSales: 0,
      cardSales: 0,
      totalSales: 0,
      ordersCount: 0,
      writeOffsTotal: 0,
      suppliesTotal: 0,
      createdAt: now,
      updatedAt: now,
    };

    store.currentShift = shift;
    return wrapResponse(shift);
  },

  async close(id: number, data: ShiftCloseData): Promise<ApiResponse<Shift>> {
    await mockDelay();
    const store = getStore();

    if (!store.currentShift || store.currentShift.id !== id) {
      throw { status: 404, name: 'NotFoundError', message: 'Shift not found or not open' };
    }

    const now = nowISO();
    const closedShift: Shift = {
      ...store.currentShift,
      closedAt: now,
      closedBy: data.closedBy,
      closingCash: data.closingCash,
      notes: data.notes,
      status: 'closed',
      updatedAt: now,
    };

    store.closedShifts.unshift(closedShift);
    store.currentShift = null;

    return wrapResponse(closedShift);
  },

  async getAll(params: GetShiftsParams = {}): Promise<ApiResponse<Shift[]>> {
    await mockDelay();
    const store = getStore();
    let items: Shift[] = [...store.closedShifts];
    if (store.currentShift) {
      items.unshift(store.currentShift);
    }

    if (params.status) {
      items = items.filter((s) => s.status === params.status);
    }

    items.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<Shift>> {
    await mockDelay();
    const store = getStore();
    const shift = store.currentShift?.id === id
      ? store.currentShift
      : store.closedShifts.find((s) => s.id === id);

    if (!shift) throw { status: 404, name: 'NotFoundError', message: 'Shift not found' };
    return wrapResponse(shift);
  },
};
