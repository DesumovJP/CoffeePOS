export type ActivityType =
  | 'order_create'
  | 'order_status'
  | 'supply_receive'
  | 'writeoff_create'
  | 'shift_open'
  | 'shift_close';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  details: Record<string, unknown>;
}

let activityCounter = 0;

export function generateActivityId(type: ActivityType): string {
  activityCounter++;
  return `${type}_${Date.now()}_${activityCounter}`;
}
