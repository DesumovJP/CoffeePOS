'use client';

/**
 * CoffeePOS - History Page (Історія)
 *
 * Order history with date filters and search.
 * Uses real orders API (/api/orders) for live mode.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Text, GlassCard, Icon, Badge, Button } from '@/components';
import { SearchInput, CategoryTabs, type Category } from '@/components/molecules';
import { useOrders } from '@/lib/hooks';
import styles from './page.module.css';

// ============================================
// HELPERS
// ============================================

const filterCategories: Category[] = [
  { id: 'today', name: 'Сьогодні' },
  { id: 'yesterday', name: 'Вчора' },
  { id: 'week', name: 'Тиждень' },
];

function getDateRange(filter: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') {
    return { dateFrom: todayStart.toISOString() };
  }

  if (filter === 'yesterday') {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return { dateFrom: yesterdayStart.toISOString(), dateTo: todayStart.toISOString() };
  }

  if (filter === 'week') {
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { dateFrom: weekAgo.toISOString() };
  }

  return {};
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Сьогодні';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчора';
  }
  return date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
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

interface OrderGroup {
  dateKey: string;
  label: string;
  orders: any[];
}

function groupOrdersByDate(orders: any[]): OrderGroup[] {
  const groups = new Map<string, any[]>();

  for (const order of orders) {
    const dateKey = new Date(order.createdAt).toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(order);
  }

  return Array.from(groups.entries()).map(([dateKey, orders]) => ({
    dateKey,
    label: formatDateGroup(orders[0].createdAt),
    orders,
  }));
}

// ============================================
// COMPONENT
// ============================================

export default function HistoryPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setSearchQuery('');
  }, []);

  const dateRange = useMemo(() => getDateRange(selectedFilter), [selectedFilter]);

  const { data: orders = [], isLoading } = useOrders({
    ...dateRange,
    pageSize: 100,
  });

  // Client-side search filter (by order number)
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o: any) =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        String(o.total || '').includes(q)
    );
  }, [orders, searchQuery]);

  const grouped = useMemo(() => groupOrdersByDate(filteredOrders), [filteredOrders]);

  // Summary stats
  const summary = useMemo(() => {
    const completedOrders = filteredOrders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0);
    return {
      count: filteredOrders.length,
      ordersCount: completedOrders.length,
      totalRevenue,
    };
  }, [filteredOrders]);

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
        <CategoryTabs
          categories={filterCategories}
          value={selectedFilter === 'all' ? null : selectedFilter}
          showAll={true}
          allLabel="Всі"
          onChange={(id) => setSelectedFilter(id || 'all')}
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
              Замовлень не знайдено
            </Text>
            <Text variant="caption" color="tertiary">
              Спробуйте змінити фільтри або пошуковий запит
            </Text>
          </GlassCard>
        ) : (
          grouped.map((group) => (
            <div key={group.dateKey} className={styles.dateGroup}>
              <div className={styles.dateGroupHeader}>
                <Text variant="labelMedium" weight="semibold" color="secondary">
                  {group.label}
                </Text>
                <Text variant="caption" color="tertiary">
                  {group.orders.length} зам.
                </Text>
              </div>
              <div className={styles.dateGroupOrders}>
                {group.orders.map((order: any) => {
                  const total = parseFloat(order.total) || 0;
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const itemCount = order.items?.length || 0;
                  const paymentMethod = order.payment?.method || order.paymentMethod;

                  return (
                    <div key={order.id || order.documentId} className={styles.activityItem}>
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
                          {itemCount > 0 && (
                            <Text variant="bodySmall" color="secondary">
                              · {itemCount} поз.
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
