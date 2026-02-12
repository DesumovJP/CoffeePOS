'use client';

/**
 * ParadisePOS - Orders History Page
 *
 * View and manage completed orders with accordion details
 */

import { useState, useMemo } from 'react';
import { Text, GlassCard, Icon } from '@/components';
import { SearchInput, CategoryTabs, type Category, OrderAccordion, type OrderData } from '@/components/molecules';
import { useOrders } from '@/lib/hooks';
import type { Order, PaymentMethod } from '@/lib/api';
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

function mapPaymentMethod(method?: PaymentMethod): 'cash' | 'card' | 'other' {
  if (method === 'cash') return 'cash';
  if (method === 'card') return 'card';
  return 'other';
}

function orderToAccordionData(order: Order): OrderData {
  return {
    id: order.orderNumber,
    items: (order.items || []).map((item) => ({
      id: String(item.id),
      name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
      modifiers: item.modifiers?.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
      })),
    })),
    createdAt: new Date(order.createdAt).getTime(),
    status: order.status === 'completed' ? 'completed' : 'cancelled',
    table: order.tableNumber,
    customer: order.customerName,
    paymentMethod: mapPaymentMethod(order.payment?.method),
  };
}

function calculateTotal(order: Order): number {
  return order.total;
}

// Group orders by date
function groupOrdersByDate(orders: Order[]): Map<string, Order[]> {
  const groups = new Map<string, Order[]>();

  orders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(order);
  });

  return groups;
}

// ============================================
// COMPONENT
// ============================================

export default function OrdersPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Build API params from filters
  const dateRange = useMemo(() => getDateRange(selectedFilter), [selectedFilter]);

  const { data: orders, isLoading } = useOrders({
    status: ['completed', 'cancelled'],
    sort: 'createdAt:desc',
    ...dateRange,
  });

  // Client-side search filter
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    if (!searchQuery.trim()) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.items?.some((i) => i.productName.toLowerCase().includes(query))
    );
  }, [orders, searchQuery]);

  // Group filtered orders by date
  const groupedOrders = useMemo(() => {
    return groupOrdersByDate(filteredOrders);
  }, [filteredOrders]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const completed = filteredOrders.filter((o) => o.status === 'completed');
    const totalRevenue = completed.reduce((sum, o) => sum + calculateTotal(o), 0);
    return {
      count: filteredOrders.length,
      completedCount: completed.length,
      totalRevenue,
    };
  }, [filteredOrders]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <CategoryTabs
          categories={filterCategories}
          value={selectedFilter === 'all' ? null : selectedFilter}
          showAll={true}
          allLabel="Всі"
          onChange={(id) => setSelectedFilter(id || 'all')}
        />
        <div className={styles.toolbarRight}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Пошук..."
            variant="glass"
          />
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <Icon name="receipt" size="sm" color="accent" />
              <Text variant="labelMedium" weight="semibold">{summary.count}</Text>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Icon name="cash" size="sm" color="success" />
              <Text variant="labelMedium" weight="semibold">₴{summary.totalRevenue.toFixed(0)}</Text>
            </div>
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
              Замовлення не знайдено
            </Text>
            <Text variant="caption" color="tertiary">
              Спробуйте змінити фільтри або пошуковий запит
            </Text>
          </GlassCard>
        ) : (
          Array.from(groupedOrders.entries()).map(([dateKey, dateOrders]) => (
            <div key={dateKey} className={styles.dateGroup}>
              <div className={styles.dateGroupHeader}>
                <Text variant="labelMedium" weight="semibold" color="secondary">
                  {formatDateGroup(dateOrders[0].createdAt)}
                </Text>
                <Text variant="caption" color="tertiary">
                  {dateOrders.length} зам. · ₴{dateOrders.filter((o) => o.status === 'completed').reduce((s, o) => s + calculateTotal(o), 0).toFixed(0)}
                </Text>
              </div>
              <div className={styles.dateGroupOrders}>
                {dateOrders.map((order) => (
                  <div key={order.id} className={styles.orderWrapper}>
                    {order.status !== 'completed' && (
                      <div className={`${styles.statusIndicator} ${styles[order.status]}`} />
                    )}
                    <OrderAccordion
                      order={orderToAccordionData(order)}
                      isExpanded={expandedOrderId === order.orderNumber}
                      onToggle={() => toggleOrder(order.orderNumber)}
                      showTable={true}
                      showCustomer={true}
                      showPaymentMethod={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
