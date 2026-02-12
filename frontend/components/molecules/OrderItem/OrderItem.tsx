'use client';

/**
 * ParadisePOS - OrderItem Component
 *
 * Minimal, clean cart line item
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { Icon } from '@/components/atoms';
import styles from './OrderItem.module.css';

// ============================================
// TYPES
// ============================================

export interface OrderItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface OrderItemData {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  modifiers?: OrderItemModifier[];
  notes?: string;
}

export interface OrderItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  item: OrderItemData;
  currency?: string;
  editable?: boolean;
  compact?: boolean;
  onQuantityChange?: (itemId: string, quantity: number) => void;
  onRemove?: (itemId: string) => void;
  onEdit?: (item: OrderItemData) => void;
}

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(2)}`;
}

function calculateItemTotal(item: OrderItemData): number {
  const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
  return (item.price + modifiersTotal) * item.quantity;
}

// ============================================
// COMPONENT
// ============================================

export const OrderItem = forwardRef<HTMLDivElement, OrderItemProps>(
  (
    {
      item,
      currency = '₴',
      editable = true,
      compact = false,
      onQuantityChange,
      onRemove,
      onEdit,
      className,
      ...props
    },
    ref
  ) => {
    const total = calculateItemTotal(item);
    const hasModifiers = item.modifiers && item.modifiers.length > 0;
    const hasMeta = hasModifiers || item.notes;

    const handleIncrement = () => {
      onQuantityChange?.(item.id, item.quantity + 1);
    };

    const handleDecrement = () => {
      if (item.quantity > 1) {
        onQuantityChange?.(item.id, item.quantity - 1);
      } else {
        onRemove?.(item.id);
      }
    };

    const handleRemove = () => {
      onRemove?.(item.id);
    };

    const classNames = [
      styles.item,
      compact && styles.compact,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Image with quantity badge */}
        <div className={styles.imageWrap}>
          {item.image ? (
            <img src={item.image} alt={item.name} className={styles.image} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <Icon name="coffee" size="sm" />
            </div>
          )}
          {item.quantity > 1 && (
            <span className={styles.qtyBadge}>{item.quantity}</span>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <span className={styles.name}>{item.name}</span>
          {hasMeta && (
            <span className={styles.meta}>
              {hasModifiers && item.modifiers!.map((mod) => mod.name).join(', ')}
              {hasModifiers && item.notes && ' · '}
              {item.notes && <span className={styles.notes}>{item.notes}</span>}
            </span>
          )}
        </div>

        {/* Right: price + controls */}
        <div className={styles.right}>
          <span className={styles.price}>{formatPrice(total, currency)}</span>

          {editable && (
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={handleDecrement}
                aria-label="Зменшити"
              >
                <Icon name="minus" size="xs" />
              </button>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={handleIncrement}
                aria-label="Збільшити"
              >
                <Icon name="plus" size="xs" />
              </button>
              <button
                type="button"
                className={`${styles.controlBtn} ${styles.danger}`}
                onClick={handleRemove}
                aria-label="Видалити"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

OrderItem.displayName = 'OrderItem';
