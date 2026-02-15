/**
 * CoffeePOS - Mock API Helpers
 *
 * Shared utilities for mock services
 */

import type { ApiResponse } from '@/lib/api/client';

export const IS_MOCK = process.env.NEXT_PUBLIC_API_MODE === 'mock';

let _nextId = 1000;

export function generateId(): number {
  return ++_nextId;
}

export function generateDocumentId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export async function mockDelay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function wrapResponse<T>(data: T, total?: number): ApiResponse<T> {
  const response: ApiResponse<T> = { data };
  if (total !== undefined) {
    response.meta = {
      pagination: {
        page: 1,
        pageSize: 25,
        pageCount: Math.ceil(total / 25),
        total,
      },
    };
  }
  return response;
}

export function strapiTimestamps() {
  const now = nowISO();
  return { createdAt: now, updatedAt: now, publishedAt: now };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
