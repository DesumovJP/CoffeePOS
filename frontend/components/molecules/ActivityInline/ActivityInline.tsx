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
  order_create: { icon: 'cart', color: 'accent', label: 'Нове замовлення' },
  order_status: { icon: 'receipt', color: 'info', label: 'Статус замовлення' },
  order_cancel: { icon: 'close', color: 'error', label: 'Скасовано' },
  supply_create: { icon: 'package', color: 'info', label: 'Нова поставка' },
  supply_receive: { icon: 'check', color: 'info', label: 'Поставку отримано' },
  writeoff_create: { icon: 'minus', color: 'error', label: 'Списання' },
  ingredient_adjust: { icon: 'package', color: 'info', label: 'Корекція залишку' },
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
    case 'order_create':
      return `${details.orderNumber} • ₴${Number(details.total || 0).toFixed(0)} • ${details.itemCount} поз.`;
    case 'order_status':
      return `#${details.orderNumber || details.orderId || '—'}: ${details.fromStatus || details.from} → ${details.toStatus || details.to}`;
    case 'order_cancel':
      return `${details.orderNumber}${details.reason ? ' • ' + details.reason : ''}`;
    case 'supply_create':
      return `${details.supplierName} • ${details.itemCount} поз. • ₴${Number(details.totalCost || 0).toFixed(0)}`;
    case 'supply_receive':
      return `${details.supplierName} • ₴${Number(details.totalCost || 0).toFixed(0)}`;
    case 'writeoff_create':
      return `${details.type === 'expired' ? 'Прострочено' : details.type === 'damaged' ? 'Пошкоджено' : 'Інше'} • ${details.itemCount} поз. • ₴${Number(details.totalCost || 0).toFixed(0)}`;
    case 'ingredient_adjust':
      return `${details.name} • ${details.previousQty} → ${details.newQty}`;
    default:
      return '';
  }
}

export function ActivityInline({ type, timestamp, details }: ActivityInlineProps) {
  const config = ACTIVITY_CONFIG[type] || { icon: 'info' as IconName, color: 'tertiary' as IconColor, label: type };

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
