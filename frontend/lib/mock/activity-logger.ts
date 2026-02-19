/**
 * CoffeePOS - Activity Logger
 *
 * Logs all business events to MockStore.activities[]
 */

import type { ShiftActivityType, ShiftActivity } from '@/lib/api/reports';
import { getStore } from './store';
import { generateDocumentId, nowISO } from './helpers';

export function logActivity(
  type: ShiftActivityType,
  details: Record<string, any>
): ShiftActivity {
  const activity: ShiftActivity = {
    id: generateDocumentId(),
    type,
    timestamp: nowISO(),
    details,
  };
  getStore().activities.push(activity);
  return activity;
}
