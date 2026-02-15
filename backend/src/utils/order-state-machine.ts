const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

export function getTimestampField(newStatus: string): string | null {
  switch (newStatus) {
    case 'preparing': return null;
    case 'ready': return 'preparedAt';
    case 'completed': return 'completedAt';
    default: return null;
  }
}

export function getAllowedTransitions(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}
