'use client';

/**
 * CoffeePOS - OrderSummary Component
 *
 * Order/cart panel with items, totals, and checkout actions
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { Text, Button, Icon, GlassCard, Divider } from '@/components/atoms';
import { OrderItem, PriceTag, type OrderItemData } from '@/components/molecules';
import styles from './OrderSummary.module.css';

// ============================================
// TYPES
// ============================================

export interface OrderDiscount {
  id: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
}

export interface OrderSummaryProps extends HTMLAttributes<HTMLDivElement> {
  /** Order items */
  items: OrderItemData[];
  /** Applied discounts */
  discounts?: OrderDiscount[];
  /** Tax rate (0-1) */
  taxRate?: number;
  /** Currency symbol */
  currency?: string;
  /** Order number/ID */
  orderNumber?: string;
  /** Customer name */
  customerName?: string;
  /** Table number */
  tableNumber?: string;
  /** Show tax breakdown */
  showTax?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback when item quantity changes */
  onQuantityChange?: (itemId: string, quantity: number) => void;
  /** Callback when item is removed */
  onRemoveItem?: (itemId: string) => void;
  /** Callback when item is edited */
  onEditItem?: (item: OrderItemData) => void;
  /** Callback for checkout */
  onCheckout?: () => void;
  /** Callback to clear order */
  onClear?: () => void;
  /** Callback to hold/park order */
  onHold?: () => void;
  /** Callback to add discount */
  onAddDiscount?: () => void;
}

// ============================================
// HELPERS
// ============================================

function calculateItemTotal(item: OrderItemData): number {
  const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
  return (item.price + modifiersTotal) * item.quantity;
}

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(2)}`;
}

// ============================================
// COMPONENT
// ============================================

export const OrderSummary = forwardRef<HTMLDivElement, OrderSummaryProps>(
  (
    {
      items,
      discounts = [],
      taxRate = 0,
      currency = '₴',
      orderNumber,
      customerName,
      tableNumber,
      showTax = false,
      compact = false,
      loading = false,
      onQuantityChange,
      onRemoveItem,
      onEditItem,
      onCheckout,
      onClear,
      onHold,
      onAddDiscount,
      className,
      ...props
    },
    ref
  ) => {
    // Calculate totals
    const { subtotal, discountTotal, tax, total, itemCount } = useMemo(() => {
      const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      // Calculate discounts
      let discountTotal = 0;
      for (const discount of discounts) {
        if (discount.type === 'percent') {
          discountTotal += subtotal * (discount.value / 100);
        } else {
          discountTotal += discount.value;
        }
      }

      const afterDiscount = subtotal - discountTotal;
      const tax = showTax ? afterDiscount * taxRate : 0;
      const total = afterDiscount + tax;

      return { subtotal, discountTotal, tax, total, itemCount };
    }, [items, discounts, taxRate, showTax]);

    const isEmpty = items.length === 0;

    const classNames = [
      styles.container,
      compact && styles.compact,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <Text variant="h4">Замовлення</Text>
            {orderNumber && (
              <Text variant="caption" color="tertiary">
                #{orderNumber}
              </Text>
            )}
          </div>

          <div className={styles.headerMeta}>
            {tableNumber && (
              <div className={styles.metaItem}>
                <Icon name="store" size="sm" color="tertiary" />
                <Text variant="labelSmall" color="secondary">
                  Стіл {tableNumber}
                </Text>
              </div>
            )}
            {customerName && (
              <div className={styles.metaItem}>
                <Icon name="user" size="sm" color="tertiary" />
                <Text variant="labelSmall" color="secondary">
                  {customerName}
                </Text>
              </div>
            )}
          </div>

          {!isEmpty && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              aria-label="Очистити замовлення"
            >
              <Icon name="delete" size="sm" />
            </Button>
          )}
        </div>

        {/* Items */}
        <div className={styles.items}>
          {isEmpty ? (
            <div className={styles.empty}>
              <Icon name="cart" size="2xl" color="tertiary" />
              <Text variant="bodyMedium" color="secondary">
                Замовлення порожнє
              </Text>
              <Text variant="caption" color="tertiary">
                Оберіть товари зліва
              </Text>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  currency={currency}
                  compact={compact}
                  editable
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemoveItem}
                  onEdit={onEditItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        {!isEmpty && (
          <div className={styles.footer}>
            {/* Discount button */}
            {onAddDiscount && (
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onAddDiscount}
                className={styles.discountButton}
              >
                <Icon name="percent" size="sm" />
                Додати знижку
              </Button>
            )}

            {/* Applied discounts */}
            {discounts.length > 0 && (
              <div className={styles.discounts}>
                {discounts.map((discount) => (
                  <div key={discount.id} className={styles.discountRow}>
                    <Text variant="labelSmall" color="secondary">
                      {discount.name}
                    </Text>
                    <Text variant="labelSmall" color="error">
                      -{discount.type === 'percent'
                        ? `${discount.value}%`
                        : formatPrice(discount.value, currency)}
                    </Text>
                  </div>
                ))}
              </div>
            )}

            <Divider spacing="sm" />

            {/* Totals */}
            <div className={styles.totals}>
              {discountTotal > 0 && (
                <div className={styles.totalRow}>
                  <Text variant="labelMedium" color="error">
                    Знижка
                  </Text>
                  <Text variant="labelMedium" color="error">
                    -{formatPrice(discountTotal, currency)}
                  </Text>
                </div>
              )}

              {showTax && tax > 0 && (
                <div className={styles.totalRow}>
                  <Text variant="labelMedium" color="secondary">
                    ПДВ ({(taxRate * 100).toFixed(0)}%)
                  </Text>
                  <Text variant="labelMedium" color="secondary">
                    {formatPrice(tax, currency)}
                  </Text>
                </div>
              )}

              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <Text variant="h4">До сплати</Text>
                <Text variant="h3" color="accent">
                  {formatPrice(total, currency)}
                </Text>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              {onHold && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onHold}
                  className={styles.holdButton}
                >
                  <Icon name="clock" size="md" />
                  Відкласти
                </Button>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onCheckout}
                loading={loading}
                className={styles.checkoutButton}
              >
                <Icon name="cash" size="md" />
                Оплата
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OrderSummary.displayName = 'OrderSummary';
