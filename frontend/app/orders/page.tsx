'use client';

/**
 * CoffeePOS - History Page (Історія)
 *
 * Clean shift order history:
 *  - Stats strip (count, revenue, cash, card, avg)
 *  - Single-column list of compact order cards
 *  - Click card → detail modal (no accordion)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Text, Icon, Button, Modal, Spinner } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { useOrders } from '@/lib/hooks';
import { useShiftStore, selectCurrentShift } from '@/lib/store';
import styles from './page.module.css';

// ============================================
// TYPES
// ============================================

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: Array<{ id: string; name: string; price: number }>;
}

interface OrderData {
  id: string;
  items: OrderItem[];
  createdAt: number;
  status?: string;
  paymentMethod?: 'cash' | 'card' | 'other';
}

// ============================================
// HELPERS
// ============================================

function getTodayRange(): { dateFrom: string } {
  const now = new Date();
  return {
    dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
  };
}

function formatTime(ts: number): string {
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
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}г ${m % 60}хв` : `${m}хв`;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function calcTotal(order: OrderData): number {
  return order.items.reduce((s, item) => {
    const mods = item.modifiers?.reduce((m, mod) => m + mod.price, 0) || 0;
    return s + (item.price + mods) * item.quantity;
  }, 0);
}

function getPaymentIcon(method?: string): 'cash' | 'card' | 'receipt' {
  if (method === 'cash') return 'cash';
  if (method === 'card') return 'card';
  return 'receipt';
}

function getPaymentLabel(method?: string): string {
  if (method === 'cash') return 'Готівка';
  if (method === 'card') return 'Карта';
  return 'Інше';
}

// ============================================
// ORDER CARD
// ============================================

interface OrderCardProps {
  order: OrderData;
  index: number;
  onClick: () => void;
}

function OrderCard({ order, index, onClick }: OrderCardProps) {
  const total = calcTotal(order);
  const preview = order.items
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
    .join(', ');

  return (
    <button className={styles.orderCard} onClick={onClick}>
      <span className={styles.orderNum}>#{index}</span>
      <div className={styles.orderInfo}>
        <div className={styles.orderMeta}>
          <Text variant="labelSmall" weight="semibold">{formatTime(order.createdAt)}</Text>
          {order.id.startsWith('ORD-') && (
            <Text variant="caption" color="tertiary" className={styles.orderId}>
              {order.id}
            </Text>
          )}
        </div>
        <Text variant="bodySmall" color="secondary" className={styles.orderPreview}>
          {preview}
        </Text>
      </div>
      <div className={styles.orderRight}>
        <Text variant="labelMedium" weight="bold">₴{formatCurrency(total)}</Text>
        {order.paymentMethod && (
          <Icon name={getPaymentIcon(order.paymentMethod)} size="sm" color="tertiary" />
        )}
      </div>
    </button>
  );
}

// ============================================
// ORDER DETAIL (modal body)
// ============================================

function OrderDetail({ order }: { order: OrderData }) {
  const total = calcTotal(order);

  return (
    <div className={styles.detailContent}>
      {/* Items table */}
      <div className={styles.detailTable}>
        <div className={styles.detailTableHeader}>
          <Text variant="caption" color="tertiary">Позиція</Text>
          <Text variant="caption" color="tertiary" className={styles.colRight}>К-сть</Text>
          <Text variant="caption" color="tertiary" className={styles.colRight}>Сума</Text>
        </div>
        {order.items.map((item, idx) => {
          const mods = item.modifiers?.reduce((m, mod) => m + mod.price, 0) || 0;
          const itemTotal = (item.price + mods) * item.quantity;
          return (
            <div key={idx} className={styles.detailRow}>
              <div className={styles.detailItemName}>
                <Text variant="bodyMedium">{item.name}</Text>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className={styles.detailMods}>
                    {item.modifiers.map((mod, midx) => (
                      <Text key={midx} variant="caption" color="tertiary">
                        + {mod.name}{mod.price > 0 && ` (₴${mod.price})`}
                      </Text>
                    ))}
                  </div>
                )}
              </div>
              <Text variant="bodySmall" color="secondary" className={styles.colRight}>
                {item.quantity}×
              </Text>
              <Text variant="bodyMedium" weight="medium" className={styles.colRight}>
                ₴{itemTotal.toFixed(0)}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.detailFooter}>
        {order.paymentMethod && (
          <div className={styles.detailPayment}>
            <Icon name={getPaymentIcon(order.paymentMethod)} size="sm" color="tertiary" />
            <Text variant="caption" color="tertiary">{getPaymentLabel(order.paymentMethod)}</Text>
          </div>
        )}
        <div className={styles.detailTotal}>
          <Text variant="labelMedium" color="secondary">Всього</Text>
          <Text variant="h4" weight="bold">₴{formatCurrency(total)}</Text>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selected, setSelected] = useState<{ order: OrderData; index: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const currentShift = useShiftStore(selectCurrentShift);

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
    setSearch('');
  }, []);

  const dateRange = useMemo(() => {
    if (currentShift?.openedAt) return { dateFrom: currentShift.openedAt };
    return getTodayRange();
  }, [currentShift]);

  const { data: ordersRaw = [], isLoading } = useOrders({
    ...dateRange,
    pageSize: 200,
    sort: 'createdAt:asc',
  });

  // Normalize and sort ascending
  const ordersData: OrderData[] = useMemo(
    () =>
      [...ordersRaw]
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((order: any): OrderData => ({
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
    [ordersRaw],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ordersData;
    return ordersData.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [ordersData, search]);

  // Aggregate stats from all orders this shift
  const stats = useMemo(() => {
    const completed = ordersData.filter((o) => o.status === 'completed' || !o.status);
    const revenue = completed.reduce((s, o) => s + calcTotal(o), 0);
    const cash = completed
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((s, o) => s + calcTotal(o), 0);
    const card = completed
      .filter((o) => o.paymentMethod === 'card')
      .reduce((s, o) => s + calcTotal(o), 0);
    const avg = completed.length > 0 ? revenue / completed.length : 0;
    return { count: completed.length, revenue, cash, card, avg };
  }, [ordersData]);

  const shiftDuration = useMemo(() => {
    if (!currentShift?.openedAt) return 0;
    return now - new Date(currentShift.openedAt).getTime();
  }, [currentShift, now]);

  const isStaleShift = shiftDuration > 86400000;

  return (
    <div className={styles.page}>
      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук за номером або товаром..."
            variant="glass"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={closeMobileSearch}
            aria-label="Закрити пошук"
          >
            <Icon name="close" size="md" />
          </Button>
        </div>
      )}

      {/* Shift context banner */}
      <div className={`${styles.shiftBanner} ${isStaleShift ? styles.shiftBannerWarn : ''}`}>
        <Icon
          name={isStaleShift ? 'warning' : currentShift ? 'check' : 'clock'}
          size="sm"
        />
        <Text variant="bodySmall" weight="medium">
          {currentShift
            ? `${isStaleShift ? '⚠ ' : ''}Зміна · ${currentShift.openedBy} · ${formatDateTime(currentShift.openedAt)} · ${formatDuration(shiftDuration)}`
            : 'Зміна не відкрита — замовлення за сьогодні'}
        </Text>
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <Text variant="caption" color="tertiary">Замовлень</Text>
          <Text variant="labelLarge" weight="bold">{stats.count}</Text>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <Text variant="caption" color="tertiary">Виручка</Text>
          <Text variant="labelLarge" weight="bold" color="success">
            ₴{formatCurrency(stats.revenue)}
          </Text>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <Icon name="cash" size="sm" color="tertiary" />
          <Text variant="labelMedium" weight="semibold">₴{formatCurrency(stats.cash)}</Text>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <Icon name="card" size="sm" color="tertiary" />
          <Text variant="labelMedium" weight="semibold">₴{formatCurrency(stats.card)}</Text>
        </div>
        {stats.count > 0 && (
          <>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Text variant="caption" color="tertiary">Сер. чек</Text>
              <Text variant="labelMedium" weight="semibold">₴{formatCurrency(stats.avg)}</Text>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Пошук за номером або товаром..."
        variant="glass"
      />

      {/* Orders */}
      <div className={styles.ordersList}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Spinner size="md" />
            <Text variant="bodyMedium" color="secondary">Завантаження...</Text>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name={search ? 'search' : 'clock'} size="2xl" color="tertiary" />
            <Text variant="bodyLarge" color="secondary">
              {search ? 'Нічого не знайдено' : 'Замовлень поки немає'}
            </Text>
            {!search && (
              <Text variant="caption" color="tertiary">
                Замовлення з'являться тут після оплати
              </Text>
            )}
          </div>
        ) : (
          filtered.map((order, idx) => (
            <OrderCard
              key={order.id}
              order={order}
              index={idx + 1}
              onClick={() => setSelected({ order, index: idx + 1 })}
            />
          ))
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={`Замовлення #${selected.index}`}
          subtitle={selected.order.id}
          icon="receipt"
          size="sm"
        >
          <OrderDetail order={selected.order} />
        </Modal>
      )}
    </div>
  );
}
