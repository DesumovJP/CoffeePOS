'use client';

import { Text, Icon } from '@/components/atoms';
import type { IconName, IconColor } from '@/components/atoms/Icon/Icon';
import type { ShiftActivityType } from '@/lib/api/reports';
import styles from './ActivityInline.module.css';

export interface ActivityInlineProps {
  type: ShiftActivityType;
  timestamp: string;
  details: Record<string, any>;
}

interface ActivityConfig {
  icon: IconName;
  color: IconColor;
  label: string;
}

const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
  shift_open: { icon: 'unlock', color: 'success', label: 'Зміна відкрита' },
  shift_close: { icon: 'lock', color: 'error', label: 'Зміна закрита' },
  order_status: { icon: 'receipt', color: 'info', label: 'Статус замовлення' },
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSummary(type: ShiftActivityType, details: Record<string, any>): string {
  switch (type) {
    case 'shift_open':
      return `${details.openedBy || '—'} • Каса: ₴${details.openingCash ?? 0}`;
    case 'shift_close':
      return `${details.closedBy || '—'} • Продажі: ₴${details.totalSales ?? 0} (${details.ordersCount ?? 0} зам.)`;
    case 'order_status':
      return `#${details.orderNumber || details.orderId || '—'}: ${details.fromStatus} → ${details.toStatus}`;
    default:
      return '';
  }
}

export function ActivityInline({ type, timestamp, details }: ActivityInlineProps) {
  const config = ACTIVITY_CONFIG[type];
  if (!config) return null;

  const summary = getSummary(type, details);

  return (
    <div className={styles.inline}>
      <div className={`${styles.iconWrap} ${styles[`icon-${config.color}`]}`}>
        <Icon name={config.icon} size="sm" color={config.color} />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <Text variant="labelMedium" weight="medium">{config.label}</Text>
          <Text variant="caption" color="tertiary">{formatTime(timestamp)}</Text>
        </div>
        {summary && (
          <Text variant="bodySmall" color="secondary">{summary}</Text>
        )}
      </div>
    </div>
  );
}

export default ActivityInline;
