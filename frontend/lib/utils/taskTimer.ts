/**
 * Task Timer — offline-first localStorage store
 *
 * Keeps startedAt timestamps for in-progress tasks so the timer survives
 * page refreshes, network loss, and app restarts.
 *
 * Offline queue stores failed backend syncs and replays them when the
 * browser comes back online.
 */

const TIMER_KEY = 'coffeepos-timers';
const QUEUE_KEY = 'coffeepos-offline-queue';

// ─── types ────────────────────────────────────────────────────────────────────

interface TimerRecord {
  startedAt: string; // ISO date string
}

export type QueuedAction =
  | { type: 'start';    documentId: string; startedAt: string }
  | { type: 'complete'; documentId: string; completedBy: string; duration: number; completionNote?: string; completionPhotoId?: number };

// ─── timer store ──────────────────────────────────────────────────────────────

function readTimers(): Record<string, TimerRecord> {
  try { return JSON.parse(localStorage.getItem(TIMER_KEY) ?? '{}'); }
  catch { return {}; }
}

function writeTimers(timers: Record<string, TimerRecord>): void {
  localStorage.setItem(TIMER_KEY, JSON.stringify(timers));
}

export const taskTimer = {
  start(documentId: string): Date {
    const startedAt = new Date();
    const timers = readTimers();
    timers[documentId] = { startedAt: startedAt.toISOString() };
    writeTimers(timers);
    return startedAt;
  },

  get(documentId: string): Date | null {
    const record = readTimers()[documentId];
    return record ? new Date(record.startedAt) : null;
  },

  /** Returns elapsed seconds since the timer was started, or null. */
  elapsed(documentId: string): number | null {
    const start = this.get(documentId);
    if (!start) return null;
    return Math.floor((Date.now() - start.getTime()) / 1000);
  },

  clear(documentId: string): void {
    const timers = readTimers();
    delete timers[documentId];
    writeTimers(timers);
  },

  /** Restore all running timers — used on mount to rehydrate UI state. */
  getAll(): Record<string, Date> {
    const timers = readTimers();
    return Object.fromEntries(
      Object.entries(timers).map(([id, r]) => [id, new Date(r.startedAt)])
    );
  },
};

// ─── offline queue ────────────────────────────────────────────────────────────

function readQueue(): QueuedAction[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); }
  catch { return []; }
}

function writeQueue(queue: QueuedAction[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const offlineQueue = {
  push(action: QueuedAction): void {
    const queue = readQueue();
    queue.push(action);
    writeQueue(queue);
  },

  drain(): QueuedAction[] {
    const queue = readQueue();
    writeQueue([]);
    return queue;
  },

  size(): number {
    return readQueue().length;
  },
};

// ─── format helpers ───────────────────────────────────────────────────────────

/** 63 → "01:03"   3723 → "1:02:03" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 63 → "1 хв 3 с"   3723 → "1 год 2 хв" */
export function formatDurationHuman(seconds: number): string {
  if (seconds < 60)   return `${seconds} с`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} год ${m} хв`;
  return `${m} хв`;
}
