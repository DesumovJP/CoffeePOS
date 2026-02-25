'use client';

/**
 * CoffeePOS - History Page (Історія)
 *
 * Current-shift order history. Shows shift context banner, sequential order
 * numbering (#1, #2, …), shift open/close events, and expandable item details.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Text, GlassCard, Icon, Button } from '@/components'; // GlassCard used for emptyState
import { SearchInput, OrderAccordion, type OrderData } from '@/components/molecules';
import { useOrders } from '@/lib/hooks';
import { useShiftStore, selectCurrentShift } from '@/lib/store';
import styles from './page.module.css';

// ============================================
// HELPERS
// ============================================

function getTodayRange(): { dateFrom: string } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { dateFrom: todayStart.toISOString() };
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} хв`;
  return `${hours} год ${minutes} хв`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}


// ============================================
// COMPONENT
// ============================================

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const currentShift = useShiftStore(selectCurrentShift);

  // Tick every minute to keep duration display live
  useEffect(() => {
    if (!currentShift) return;
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [currentShift]);

  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Use shift's openedAt as start of range; fall back to today midnight
  const dateRange = useMemo(() => {
    if (currentShift?.openedAt) return { dateFrom: currentShift.openedAt };
    return getTodayRange();
  }, [currentShift]);

  const { data: ordersRaw = [], isLoading } = useOrders({
    ...dateRange,
    pageSize: 200,
    sort: 'createdAt:asc',
  });

  // Ensure ascending order for sequential numbering
  const orders = useMemo(
    () =>
      [...ordersRaw].sort(
        (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [ordersRaw]
  );

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o: any) =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        String(o.total || '').includes(q)
    );
  }, [orders, searchQuery]);

  const filteredOrderData = useMemo((): OrderData[] =>
    filteredOrders.map((order: any): OrderData => ({
      id: order.orderNumber || String(order.id),
      items: (order.items || []).map((item: any) => ({
        id: String(item.id),
        name: item.productName || item.name || '',
        price: item.unitPrice || 0,
        quantity: item.quantity || 1,
        modifiers: (item.modifiers || []).map((m: any) => ({
          id: String(m.id || m.name),
          name: m.name || '',
          price: m.price || 0,
        })),
      })),
      createdAt: new Date(order.createdAt).getTime(),
      status: order.status,
      paymentMethod: (() => {
        const m = order.payment?.method || order.paymentMethod;
        if (m === 'cash' || m === 'card') return m;
        if (m) return 'other';
        return undefined;
      })(),
    })),
  [filteredOrders]);

  const summary = useMemo(() => {
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0);
    return { ordersCount: completedOrders.length, totalRevenue };
  }, [orders]);

  const shiftDuration = useMemo(() => {
    if (!currentShift?.openedAt) return 0;
    return now - new Date(currentShift.openedAt).getTime();
  }, [currentShift, now]);

  const toggleOrder = useCallback((orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }, []);

  return (
    <div className={styles.page}>
      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Пошук за номером замовлення..."
            variant="glass"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={closeMobileSearch}
            aria-label="Закрити пошук"
            className={styles.mobileSearchClose}
          >
            <Icon name="close" size="md" />
          </Button>
        </div>
      )}

      {/* Shift context — single subtle line */}
      {currentShift ? (
        <Text variant="bodySmall" color="tertiary" className={styles.shiftContext}>
          Зміна · {currentShift.openedBy} · {formatDateTime(currentShift.openedAt)} · {formatDuration(shiftDuration)}
        </Text>
      ) : (
        <Text variant="bodySmall" color="tertiary" className={styles.shiftContext}>
          Зміна не відкрита — замовлення за сьогодні
        </Text>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Пошук за номером замовлення..."
          variant="glass"
        />
        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <Icon name="cart" size="sm" color="accent" />
            <Text variant="labelMedium" weight="semibold">{summary.ordersCount}</Text>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <Icon name="cash" size="sm" color="success" />
            <Text variant="labelMedium" weight="semibold">₴{formatCurrency(summary.totalRevenue)}</Text>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className={styles.ordersList}>
        {isLoading ? (
          <GlassCard padding="xl" className={styles.emptyState}>
            <Icon name="clock" size="2xl" color="tertiary" />
            <Text variant="bodyLarge" color="secondary">Завантаження...</Text>
          </GlassCard>
        ) : (
          <>
            {/* Shift open event */}
            {currentShift && (
              <div className={`${styles.shiftEvent} ${styles.shiftEventOpen}`}>
                <div className={styles.shiftEventIcon}>
                  <Icon name="check" size="sm" />
                </div>
                <div className={styles.shiftEventContent}>
                  <Text variant="labelSmall" weight="semibold">Зміна відкрита</Text>
                  <Text variant="caption" color="secondary">
                    {currentShift.openedBy} · каса ₴{formatCurrency(currentShift.openingCash)}
                  </Text>
                </div>
                <Text variant="caption" color="tertiary">{formatTime(currentShift.openedAt)}</Text>
              </div>
            )}

            {filteredOrderData.length === 0 ? (
              <GlassCard padding="xl" className={styles.emptyState}>
                <Icon name="search" size="2xl" color="tertiary" />
                <Text variant="bodyLarge" color="secondary">
                  {searchQuery ? 'Нічого не знайдено' : 'Замовлень поки немає'}
                </Text>
                {!searchQuery && (
                  <Text variant="caption" color="tertiary">
                    Замовлення з'являться тут після оплати
                  </Text>
                )}
              </GlassCard>
            ) : (
              filteredOrderData.map((orderData) => (
                <OrderAccordion
                  key={orderData.id}
                  order={orderData}
                  isExpanded={expandedOrderId === orderData.id}
                  onToggle={() => toggleOrder(orderData.id)}
                  showPaymentMethod
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
