/**
 * Offline order queue.
 *
 * When `ordersApi.create` fails (network / server blip), the POS pushes the
 * full payload into localStorage here. The queue then drains automatically:
 *   - on `window.online`
 *   - on page load
 *   - on manual `flush()` from the UI
 *
 * Idempotency relies on the server accepting a duplicate `orderNumber` as a
 * no-op replay (see `backend/.../order.ts` controller). So resending a queued
 * payload after the original in fact succeeded is safe.
 */

import { ordersApi, type CreateOrderPayload } from '@/lib/api';

const STORAGE_KEY     = 'paradise-pos-order-queue';
const EVENT_NAME      = 'paradise-pos-order-queue-changed';
const MAX_ATTEMPTS    = 10;

export interface QueuedOrder {
  /** local uuid, independent of orderNumber */
  id:          string;
  orderNumber: string;
  payload:     CreateOrderPayload;
  attempts:    number;
  lastError?:  string;
  enqueuedAt:  number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function read(): QueuedOrder[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(queue: QueuedOrder[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { size: queue.length } }));
  } catch {
    // localStorage full or disabled — best-effort only
  }
}

export function getQueue(): QueuedOrder[] {
  return read();
}

export function getQueueSize(): number {
  return read().length;
}

export function enqueue(payload: CreateOrderPayload, error?: unknown): QueuedOrder {
  const queue = read();
  // Dedupe: if orderNumber already queued, just bump its error
  const idx = queue.findIndex((q) => q.orderNumber === payload.order.orderNumber);
  if (idx >= 0) {
    queue[idx].lastError = describeError(error);
    write(queue);
    return queue[idx];
  }
  const entry: QueuedOrder = {
    id:          `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderNumber: payload.order.orderNumber,
    payload,
    attempts:    0,
    lastError:   describeError(error),
    enqueuedAt:  Date.now(),
  };
  queue.push(entry);
  write(queue);
  return entry;
}

export function remove(id: string): void {
  const queue = read().filter((q) => q.id !== id);
  write(queue);
}

export function subscribe(listener: (size: number) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => listener(getQueueSize());
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

let flushInFlight = false;

export interface FlushResult {
  sent:    number;
  failed:  number;
  dropped: number;
}

/**
 * Attempt to send every queued order. Runs at most once concurrently — a
 * second caller while one is in flight returns a zero-result.
 */
export async function flush(): Promise<FlushResult> {
  if (!isBrowser() || flushInFlight) {
    return { sent: 0, failed: 0, dropped: 0 };
  }
  if (!navigator.onLine) {
    return { sent: 0, failed: 0, dropped: 0 };
  }
  flushInFlight = true;

  const result: FlushResult = { sent: 0, failed: 0, dropped: 0 };
  try {
    // Snapshot — the queue might change while we're iterating
    const snapshot = read();
    for (const entry of snapshot) {
      try {
        await ordersApi.create(entry.payload);
        remove(entry.id);
        result.sent += 1;
      } catch (err) {
        result.failed += 1;
        const status  = Number((err as any)?.status) || 0;
        const isHardBusinessError = status >= 400 && status < 500;
        const current = read();
        const idx = current.findIndex((q) => q.id === entry.id);
        if (idx >= 0) {
          current[idx].attempts += 1;
          current[idx].lastError = describeError(err);
          if (isHardBusinessError || current[idx].attempts >= MAX_ATTEMPTS) {
            // 4xx won't resolve with retries; drop so the queue doesn't spin.
            // Also give up after MAX_ATTEMPTS on transient errors. The payload
            // is still discoverable from the last-error toast.
            current.splice(idx, 1);
            result.dropped += 1;
          }
          write(current);
        }
      }
    }
  } finally {
    flushInFlight = false;
  }
  return result;
}

function describeError(err: unknown): string {
  if (!err) return '';
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}
