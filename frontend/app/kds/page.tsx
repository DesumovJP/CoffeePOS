'use client';

/**
 * CoffeePOS - KDS (Kitchen Display System)
 *
 * Fullscreen kitchen display showing active orders for baristas.
 * Features: live timers, sound notifications, item checkboxes,
 * status updates, priority indicators.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Text, Icon, Badge, Button, GlassCard, Spinner } from '@/components/atoms';
import { useActiveOrders, useUpdateOrderStatus } from '@/lib/hooks';
import { orderItemsApi } from '@/lib/api/orders';
import type { Order, OrderItem, OrderItemStatus } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// HELPERS
// ============================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function getElapsedMinutes(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 60000;
}

function formatElapsed(createdAt: string): string {
  const totalSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getTimerState(createdAt: string): 'normal' | 'warning' | 'urgent' {
  const minutes = getElapsedMinutes(createdAt);
  if (minutes > 15) return 'urgent';
  if (minutes > 10) return 'warning';
  return 'normal';
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'В залі',
  takeaway: 'З собою',
  delivery: 'Доставка',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує',
  confirmed: 'Підтверджено',
  preparing: 'Готується',
  ready: 'Готово',
};

function playNotification() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Audio not available
  }
}

// ============================================
// KDS ORDER CARD
// ============================================

interface KDSOrderCardProps {
  order: Order;
  onMarkReady: (documentId: string) => void;
  onToggleItemStatus: (documentId: string, currentStatus: OrderItemStatus) => void;
  isUpdating: boolean;
}

function KDSOrderCard({ order, onMarkReady, onToggleItemStatus, isUpdating }: KDSOrderCardProps) {
  const [elapsed, setElapsed] = useState(formatElapsed(order.createdAt));
  const [timerState, setTimerState] = useState(getTimerState(order.createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(order.createdAt));
      setTimerState(getTimerState(order.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const items = order.items || [];
  const allItemsReady = items.length > 0 && items.every(
    (item) => item.status === 'ready' || item.status === 'served' || item.status === 'cancelled'
  );

  const timerClassName = {
    normal: styles.timerNormal,
    warning: styles.timerWarning,
    urgent: styles.timerUrgent,
  }[timerState];

  const cardClassName = [
    styles.orderCard,
    styles[timerState],
    order.priority === 'rush' && styles.rush,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClassName}>
      {/* Header — order identity + context */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <Text variant="h3" weight="bold" className={styles.orderNumber}>
            #{order.orderNumber}
          </Text>
          {order.priority === 'rush' && (
            <Badge variant="error" size="sm">ТЕРМІНОВО</Badge>
          )}
          <Badge variant={order.type === 'takeaway' ? 'warning' : order.type === 'delivery' ? 'info' : 'default'} size="sm">
            {ORDER_TYPE_LABELS[order.type] || order.type}
          </Badge>
          {order.type === 'dine_in' && order.tableNumber && (
            <Badge variant="default" size="sm">Стіл {order.tableNumber}</Badge>
          )}
        </div>
        <div className={`${styles.timer} ${timerClassName}`}>
          <Icon name="clock" size="sm" />
          <Text variant="labelLarge" weight="bold">{elapsed}</Text>
        </div>
      </div>

      {/* Items */}
      <div className={styles.itemsList}>
        {items.map((item) => (
          <KDSItemRow
            key={item.id}
            item={item}
            onToggle={() => onToggleItemStatus(item.documentId, item.status)}
          />
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className={styles.notes}>
          <Icon name="info" size="sm" color="warning" />
          <Text variant="bodySmall" color="warning">
            {order.notes}
          </Text>
        </div>
      )}

      {/* Footer — bookend with header */}
      <div className={styles.cardFooter}>
        <Button
          variant="success"
          size="lg"
          fullWidth
          onClick={() => onMarkReady(order.documentId)}
          disabled={isUpdating}
          loading={isUpdating}
        >
          <Icon name="check" size="md" />
          {allItemsReady ? 'Готово' : 'Позначити готовим'}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// KDS ITEM ROW
// ============================================

interface KDSItemRowProps {
  item: OrderItem;
  onToggle: () => void;
}

function KDSItemRow({ item, onToggle }: KDSItemRowProps) {
  const isDone = item.status === 'ready' || item.status === 'served';
  const isCancelled = item.status === 'cancelled';

  return (
    <div className={`${styles.itemRow} ${isDone ? styles.itemDone : ''} ${isCancelled ? styles.itemCancelled : ''}`}>
      <button
        type="button"
        className={`${styles.itemCheckbox} ${isDone ? styles.checked : ''}`}
        onClick={onToggle}
        disabled={isCancelled}
        aria-label={isDone ? 'Позначити як не готове' : 'Позначити як готове'}
      >
        {isDone && <Icon name="check" size="xs" />}
      </button>
      <div className={styles.itemInfo}>
        <div className={styles.itemNameRow}>
          <Text
            variant="labelLarge"
            weight="semibold"
            className={isDone ? styles.strikethrough : undefined}
          >
            {item.quantity}x {item.productName}
          </Text>
        </div>
        {item.modifiers && item.modifiers.length > 0 && (
          <Text variant="bodySmall" color="secondary" className={isDone ? styles.strikethrough : undefined}>
            {item.modifiers.map((m) => m.name).join(', ')}
          </Text>
        )}
        {item.notes && (
          <Text variant="bodySmall" color="warning" className={styles.itemNote}>
            {item.notes}
          </Text>
        )}
      </div>
    </div>
  );
}

// ============================================
// KDS PAGE
// ============================================

export default function KDSPage() {
  const { data: orders, isLoading, error } = useActiveOrders();
  const updateStatus = useUpdateOrderStatus();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // Filter for kitchen-relevant statuses
  const kdsOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(
      (o) => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'pending'
    );
  }, [orders]);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sound notification when new orders appear
  useEffect(() => {
    if (!kdsOrders || kdsOrders.length === 0) return;

    const currentIds = new Set(kdsOrders.map((o) => o.documentId));
    const prevIds = prevOrderIdsRef.current;

    // Check if there are new orders
    let hasNew = false;
    currentIds.forEach((id) => {
      if (!prevIds.has(id)) hasNew = true;
    });

    if (hasNew && prevIds.size > 0) {
      playNotification();
    }

    prevOrderIdsRef.current = currentIds;
  }, [kdsOrders]);

  const handleMarkReady = useCallback(async (documentId: string) => {
    setUpdatingOrderId(documentId);
    try {
      await updateStatus.mutateAsync({ id: documentId, status: 'ready' });
    } catch {
      // Error handled by React Query
    } finally {
      setUpdatingOrderId(null);
    }
  }, [updateStatus]);

  const handleToggleItemStatus = useCallback(async (documentId: string, currentStatus: OrderItemStatus) => {
    const newStatus: OrderItemStatus = currentStatus === 'ready' ? 'preparing' : 'ready';
    try {
      await orderItemsApi.updateStatus(documentId, newStatus);
    } catch {
      // Silently fail for item status toggles
    }
  }, []);

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Badge variant="primary" size="md">
          {kdsOrders.length} {kdsOrders.length === 1 ? 'замовлення' : 'замовлень'}
        </Badge>
        <div className={styles.clock}>
          <Icon name="clock" size="sm" color="secondary" />
          <Text variant="labelMedium" weight="semibold" color="secondary">
            {formatTime(currentTime)}
          </Text>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className={styles.center}>
          <Spinner size="lg" />
          <Text variant="bodyLarge" color="secondary">
            Завантаження замовлень...
          </Text>
        </div>
      )}

      {error && (
        <div className={styles.center}>
          <Icon name="error" size="2xl" color="error" />
          <Text variant="bodyLarge" color="error">
            Помилка завантаження замовлень
          </Text>
        </div>
      )}

      {!isLoading && !error && kdsOrders.length === 0 && (
        <div className={styles.center}>
          <Icon name="check" size="2xl" color="success" />
          <Text variant="h4" color="secondary">
            Немає активних замовлень
          </Text>
          <Text variant="bodyMedium" color="tertiary">
            Нові замовлення з&#39;являться автоматично
          </Text>
        </div>
      )}

      {!isLoading && !error && kdsOrders.length > 0 && (
        <div className={styles.grid}>
          {kdsOrders.map((order) => (
            <KDSOrderCard
              key={order.documentId}
              order={order}
              onMarkReady={handleMarkReady}
              onToggleItemStatus={handleToggleItemStatus}
              isUpdating={updatingOrderId === order.documentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
