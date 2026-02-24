'use client';

/**
 * CoffeePOS - History Page (Історія)
 *
 * Today's order history. Each order is expandable to show items.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Text, GlassCard, Icon, Badge, Button } from '@/components';
import { SearchInput } from '@/components/molecules';
import { useOrders } from '@/lib/hooks';
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  completed: { label: 'Готово', variant: 'success' },
  preparing: { label: 'Готується', variant: 'warning' },
  pending: { label: 'Очікує', variant: 'default' },
  confirmed: { label: 'Підтверджено', variant: 'default' },
  ready: { label: 'Готово', variant: 'success' },
  cancelled: { label: 'Скасовано', variant: 'error' },
};

const paymentMethodLabel: Record<string, string> = {
  cash: 'Готівка',
  card: 'Картка',
  qr: 'QR',
};

// ============================================
// COMPONENT
// ============================================

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setSearchQuery('');
  }, []);

  const { data: orders = [], isLoading } = useOrders({
    ...getTodayRange(),
    pageSize: 200,
  });

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o: any) =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        String(o.total || '').includes(q)
    );
  }, [orders, searchQuery]);

  // Summary stats
  const summary = useMemo(() => {
    const completedOrders = filteredOrders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0);
    return {
      ordersCount: completedOrders.length,
      totalRevenue,
    };
  }, [filteredOrders]);

  const toggleOrder = useCallback((orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }, []);

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
      </div>

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
            <Text variant="bodyLarge" color="secondary">
              Завантаження...
            </Text>
          </GlassCard>
        ) : filteredOrders.length === 0 ? (
          <GlassCard padding="xl" className={styles.emptyState}>
            <Icon name="search" size="2xl" color="tertiary" />
            <Text variant="bodyLarge" color="secondary">
              Замовлень сьогодні немає
            </Text>
            <Text variant="caption" color="tertiary">
              Замовлення з'являться тут після оплати
            </Text>
          </GlassCard>
        ) : (
          filteredOrders.map((order: any) => {
            const orderId = order.documentId || String(order.id);
            const isExpanded = expandedOrderId === orderId;
            const total = parseFloat(order.total) || 0;
            const status = statusConfig[order.status] || statusConfig.pending;
            const items: any[] = order.items || [];
            const paymentMethod = order.payment?.method || order.paymentMethod;

            return (
              <div key={orderId} className={styles.orderCard}>
                {/* Accordion trigger */}
                <button
                  type="button"
                  className={styles.accordionTrigger}
                  onClick={() => toggleOrder(orderId)}
                  aria-expanded={isExpanded}
                >
                  <div className={styles.activityIcon}>
                    <Icon name="receipt" size="sm" />
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityHeader}>
                      <Text variant="labelMedium" weight="semibold">
                        {order.orderNumber || `#${order.id}`}
                      </Text>
                      <Text variant="caption" color="tertiary">
                        {formatTime(order.createdAt)}
                      </Text>
                    </div>
                    <div className={styles.activityMeta}>
                      <Text variant="bodySmall" weight="semibold">
                        ₴{formatCurrency(total)}
                      </Text>
                      {items.length > 0 && (
                        <Text variant="bodySmall" color="secondary">
                          · {items.length} поз.
                        </Text>
                      )}
                      {paymentMethod && (
                        <Text variant="bodySmall" color="secondary">
                          · {paymentMethodLabel[paymentMethod] || paymentMethod}
                        </Text>
                      )}
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  <Icon
                    name="chevron-right"
                    size="sm"
                    color="tertiary"
                    className={isExpanded ? styles.chevronOpen : styles.chevron}
                  />
                </button>

                {/* Expanded items list */}
                {isExpanded && items.length > 0 && (
                  <div className={styles.itemsList}>
                    {items.map((item: any, idx: number) => (
                      <div key={item.id || idx} className={styles.itemRow}>
                        <Text variant="bodySmall" className={styles.itemName}>
                          {item.productName}
                          {item.notes && (
                            <Text as="span" variant="caption" color="tertiary"> — {item.notes}</Text>
                          )}
                        </Text>
                        <Text variant="bodySmall" color="secondary" className={styles.itemQty}>
                          {item.quantity} × ₴{formatCurrency(item.unitPrice)}
                        </Text>
                        <Text variant="labelSmall" weight="semibold" className={styles.itemTotal}>
                          ₴{formatCurrency(item.totalPrice)}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && items.length === 0 && (
                  <div className={styles.itemsList}>
                    <Text variant="bodySmall" color="tertiary">Деталі позицій недоступні</Text>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
