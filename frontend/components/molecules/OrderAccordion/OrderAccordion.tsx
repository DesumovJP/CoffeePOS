'use client';

/**
 * OrderAccordion - Expandable order card component
 *
 * Displays order summary in collapsed state, full details when expanded.
 * Used in Reports modal and Orders list page.
 */

import { Text, Icon } from '@/components/atoms';
import styles from './OrderAccordion.module.css';

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface OrderData {
  id: string;
  items: OrderItem[];
  createdAt: number;
  completedAt?: number;
  status?: string;
  table?: string;
  customer?: string;
  paymentMethod?: 'cash' | 'card' | 'other';
}

export interface OrderAccordionProps {
  order: OrderData;
  isExpanded: boolean;
  onToggle: () => void;
  showTable?: boolean;
  showCustomer?: boolean;
  showPaymentMethod?: boolean;
}

// ============================================
// HELPERS
// ============================================

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateOrderTotal(order: OrderData): number {
  return order.items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers?.reduce((m, mod) => m + mod.price, 0) || 0;
    return sum + (item.price + modifiersTotal) * item.quantity;
  }, 0);
}

function getPaymentLabel(method?: 'cash' | 'card' | 'other'): string {
  switch (method) {
    case 'cash':
      return 'Готівка';
    case 'card':
      return 'Карта';
    default:
      return 'Інше';
  }
}

function getPaymentIcon(method?: 'cash' | 'card' | 'other'): 'cash' | 'card' | 'receipt' {
  switch (method) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    default:
      return 'receipt';
  }
}

// ============================================
// COMPONENT
// ============================================

export function OrderAccordion({
  order,
  isExpanded,
  onToggle,
  showTable = false,
  showCustomer = false,
  showPaymentMethod = false,
}: OrderAccordionProps) {
  const total = calculateOrderTotal(order);
  const orderNumber = order.id.split('-').pop() || order.id;

  // Compact preview: "Капучіно, Латте ×2, Круасан"
  const itemsPreview = order.items.map((item) =>
    item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name
  ).join(', ');

  return (
    <div className={`${styles.accordion} ${isExpanded ? styles.expanded : ''}`}>
      {/* Accordion Header - always visible */}
      <button
        className={styles.accordionHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className={styles.accordionLeft}>
          <div className={styles.orderBadge}>
            <Text variant="labelSmall" weight="semibold">#{orderNumber}</Text>
          </div>
          <div className={styles.accordionMeta}>
            <div className={styles.metaRow}>
              <Text variant="labelMedium" weight="medium">{formatTime(order.createdAt)}</Text>
              {showTable && order.table && (
                <>
                  <span className={styles.metaDot} />
                  <Text variant="caption" color="tertiary">Стіл {order.table}</Text>
                </>
              )}
              {showCustomer && order.customer && (
                <>
                  <span className={styles.metaDot} />
                  <Text variant="caption" color="tertiary">{order.customer}</Text>
                </>
              )}
            </div>
            <div className={styles.itemsPreview}>
              <Text variant="bodySmall" color="secondary">{itemsPreview}</Text>
            </div>
          </div>
        </div>
        <div className={styles.accordionRight}>
          <Text variant="labelLarge" weight="semibold" color="accent">
            ₴{total.toFixed(0)}
          </Text>
          <div className={`${styles.accordionChevron} ${isExpanded ? styles.rotated : ''}`}>
            <Icon name="chevron-down" size="sm" color="tertiary" />
          </div>
        </div>
      </button>

      {/* Accordion Content - expandable */}
      <div className={styles.accordionContent}>
        <div className={styles.accordionBody}>
          {/* Table */}
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <Text variant="caption" color="tertiary">Позиція</Text>
              <Text variant="caption" color="tertiary">К-сть</Text>
              <Text variant="caption" color="tertiary">Сума</Text>
            </div>

            <div className={styles.orderItemsList}>
              {order.items.map((item, idx) => {
                const itemTotal = (item.price + (item.modifiers?.reduce((m, mod) => m + mod.price, 0) || 0)) * item.quantity;
                return (
                  <div key={idx} className={styles.orderItemRow}>
                    <div className={styles.orderItemInfo}>
                      <Text variant="bodyMedium">{item.name}</Text>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className={styles.orderItemMods}>
                          {item.modifiers.map((mod, midx) => (
                            <Text key={midx} variant="caption" color="tertiary">
                              + {mod.name} {mod.price > 0 && `(₴${mod.price})`}
                            </Text>
                          ))}
                        </div>
                      )}
                    </div>
                    <Text variant="bodySmall" color="secondary" className={styles.qtyCol}>
                      {item.quantity}×
                    </Text>
                    <Text variant="bodyMedium" weight="medium" className={styles.sumCol}>
                      ₴{itemTotal.toFixed(0)}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Footer */}
          <div className={styles.orderFooter}>
            {showPaymentMethod && order.paymentMethod && (
              <div className={styles.orderFooterMeta}>
                <Icon name={getPaymentIcon(order.paymentMethod)} size="sm" color="tertiary" />
                <Text variant="caption" color="tertiary">{getPaymentLabel(order.paymentMethod)}</Text>
              </div>
            )}
            <div className={styles.orderFooterRow}>
              <Text variant="labelMedium" weight="semibold" color="secondary">Всього</Text>
              <Text variant="labelLarge" weight="bold">₴{total.toFixed(0)}</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderAccordion;
