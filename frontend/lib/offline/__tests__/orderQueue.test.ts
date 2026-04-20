import { describe, it, expect, beforeEach, vi } from 'vitest';

const createMock = vi.fn();

vi.mock('@/lib/api', () => ({
  ordersApi: {
    create: (...args: any[]) => createMock(...args),
  },
}));

import {
  enqueue,
  flush,
  getQueue,
  getQueueSize,
  remove,
} from '../orderQueue';

function payload(orderNumber: string) {
  return {
    order: {
      orderNumber,
      status: 'completed',
      type: 'dine_in',
      subtotal: 100,
      total: 100,
    } as any,
    items: [{ productName: 'Espresso', quantity: 1, unitPrice: 45, totalPrice: 45 } as any],
  };
}

describe('offline orderQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
    createMock.mockReset();
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  it('persists enqueued payloads across reads', () => {
    enqueue(payload('ORD-1'));
    expect(getQueueSize()).toBe(1);
    const q = getQueue();
    expect(q[0].orderNumber).toBe('ORD-1');
  });

  it('dedupes by orderNumber — resend only bumps lastError', () => {
    enqueue(payload('ORD-1'));
    enqueue(payload('ORD-1'), new Error('boom'));
    expect(getQueueSize()).toBe(1);
    expect(getQueue()[0].lastError).toBe('boom');
  });

  it('remove() drops by queue id', () => {
    const e = enqueue(payload('ORD-1'));
    remove(e.id);
    expect(getQueueSize()).toBe(0);
  });

  it('flush() calls ordersApi.create and drains on success', async () => {
    enqueue(payload('ORD-1'));
    enqueue(payload('ORD-2'));
    createMock.mockResolvedValue({ data: {} });

    const result = await flush();
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(getQueueSize()).toBe(0);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it('flush() leaves failed entries in queue and increments attempts', async () => {
    enqueue(payload('ORD-1'));
    createMock.mockRejectedValue(new Error('network down'));

    const result = await flush();
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    const q = getQueue();
    expect(q).toHaveLength(1);
    expect(q[0].attempts).toBe(1);
    expect(q[0].lastError).toBe('network down');
  });

  it('flush() drops an entry after MAX_ATTEMPTS', async () => {
    enqueue(payload('ORD-1'));
    createMock.mockRejectedValue(new Error('persistent failure'));

    for (let i = 0; i < 10; i++) await flush();
    expect(getQueueSize()).toBe(0);
  });

  it('flush() is a no-op when navigator is offline', async () => {
    enqueue(payload('ORD-1'));
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    const result = await flush();
    expect(result.sent).toBe(0);
    expect(createMock).not.toHaveBeenCalled();
    expect(getQueueSize()).toBe(1);
  });
});
