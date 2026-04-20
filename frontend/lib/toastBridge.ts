'use client';

import type { Toast } from '@/components/atoms/Toast/Toast';

type Handler = (toast: Omit<Toast, 'id'>) => void;

let handler: Handler | null = null;

export function setToastHandler(h: Handler | null) {
  handler = h;
}

export function emitToast(toast: Omit<Toast, 'id'>) {
  if (handler) handler(toast);
}
