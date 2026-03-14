'use client';

/**
 * OrderCard — shared compact order row used in:
 *  - /orders (History page) — sequential shift index
 *  - /admin/dashboard (Calendar day-detail modal) — no index, icon instead
 */

import { Icon } from '@/components/atoms/Icon';
import { Text } from '@/components/atoms/Text';
import styles from './OrderCard.module.css';

// ────────────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  modifiers?: Array<{ name?: string; price?: number }>;
}

export interface OrderCardProps {
  /** Sequential index within the current context (shift, day). Omit to show receipt icon. */
  index?: number;
  /** Timestamp (ms) or ISO string */
  createdAt: number | string;
  /** Order ID / number string (shown if starts with "ORD-") */
  orderId?: string;
  items: OrderItem[];
  total: number;
  paymentMethod?: 'cash' | 'card' | 'other';
  onClick?: () => void;
}

// ────────────────────────────────────────────────────────────────────────────

function formatTime(ts: number | string): string {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function getPaymentIcon(method?: string): 'cash' | 'card' | 'receipt' {
  if (method === 'cash') return 'cash';
  if (method === 'card') return 'card';
  return 'receipt';
}

// ────────────────────────────────────────────────────────────────────────────

export function OrderCard({
  index,
  createdAt,
  orderId,
  items,
  total,
  paymentMethod,
  onClick,
}: OrderCardProps) {
  const preview = items
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
    .join(', ');

  return (
    <button className={styles.card} onClick={onClick}>
      {/* Left badge: sequential number or receipt icon */}
      <span className={styles.num}>
        {index !== undefined ? `#${index}` : <Icon name="receipt" size="sm" color="secondary" />}
      </span>

      {/* Centre: time + order ID + items preview */}
      <div className={styles.info}>
        <div className={styles.meta}>
          <Text variant="labelSmall" weight="semibold">{formatTime(createdAt)}</Text>
          {orderId && orderId.startsWith('ORD-') && (
            <Text variant="caption" color="tertiary" className={styles.orderId}>
              {orderId}
            </Text>
          )}
        </div>
        <Text variant="bodySmall" color="secondary" className={styles.preview}>
          {preview || '—'}
        </Text>
      </div>

      {/* Right: total + payment icon */}
      <div className={styles.right}>
        <Text variant="labelMedium" weight="bold">₴{formatCurrency(total)}</Text>
        {paymentMethod && (
          <Icon name={getPaymentIcon(paymentMethod)} size="sm" color="tertiary" />
        )}
      </div>
    </button>
  );
}

export default OrderCard;
