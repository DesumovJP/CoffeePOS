'use client';

/**
 * CoffeePOS - ReceiptTemplate Component
 *
 * Generates a printable receipt for completed orders.
 * Uses @media print CSS for proper print formatting.
 */

import { forwardRef, useRef, useCallback, type HTMLAttributes } from 'react';
import { Button, Icon } from '@/components/atoms';
import type { Order, OrderItem, Payment } from '@/lib/api';
import styles from './ReceiptTemplate.module.css';

// ============================================
// TYPES
// ============================================

export interface ReceiptTemplateProps extends HTMLAttributes<HTMLDivElement> {
  /** Order data */
  order: Order;
  /** Order items */
  items: OrderItem[];
  /** Payment data */
  payment: Payment;
  /** Cafe name */
  cafeName?: string;
  /** Cafe address */
  cafeAddress?: string;
  /** Barista name */
  baristaName?: string;
  /** Show print button */
  showPrintButton?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'В залі',
  takeaway: 'З собою',
  delivery: 'Доставка',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Готівка',
  card: 'Картка',
  qr: 'QR-код',
  online: 'Онлайн',
  other: 'Інше',
};

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// COMPONENT
// ============================================

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  (
    {
      order,
      items,
      payment,
      cafeName = 'CoffeePOS Coffee',
      cafeAddress,
      baristaName,
      showPrintButton = true,
      className,
      ...props
    },
    ref
  ) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useCallback(() => {
      window.print();
    }, []);

    return (
      <div ref={ref} className={`${styles.wrapper} ${className || ''}`} {...props}>
        {/* Print button (hidden in print) */}
        {showPrintButton && (
          <div className={styles.actions}>
            <Button variant="secondary" size="md" onClick={handlePrint}>
              <Icon name="printer" size="sm" />
              Друкувати чек
            </Button>
          </div>
        )}

        {/* Receipt content */}
        <div ref={receiptRef} className={styles.receipt}>
          {/* Header */}
          <div className={styles.receiptHeader}>
            <div className={styles.separator}>{'='.repeat(35)}</div>
            <div className={styles.cafeName}>{cafeName}</div>
            {cafeAddress && (
              <div className={styles.cafeAddress}>{cafeAddress}</div>
            )}
            <div className={styles.divider}>{'─'.repeat(35)}</div>
          </div>

          {/* Order info */}
          <div className={styles.orderInfo}>
            <div className={styles.receiptLine}>
              <span>Чек</span>
              <span>#{order.orderNumber}</span>
            </div>
            <div className={styles.receiptLine}>
              <span>Дата</span>
              <span>{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
            </div>
            {baristaName && (
              <div className={styles.receiptLine}>
                <span>Бариста</span>
                <span>{baristaName}</span>
              </div>
            )}
            <div className={styles.receiptLine}>
              <span>Тип</span>
              <span>{ORDER_TYPE_LABELS[order.type] || order.type}</span>
            </div>
            {order.type === 'dine_in' && order.tableNumber && (
              <div className={styles.receiptLine}>
                <span>Стіл</span>
                <span>{order.tableNumber}</span>
              </div>
            )}
          </div>

          <div className={styles.divider}>{'─'.repeat(35)}</div>

          {/* Items */}
          <div className={styles.itemsSection}>
            {items.map((item) => (
              <div key={item.id} className={styles.receiptItem}>
                <div className={styles.receiptLine}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span>{item.quantity}x{formatPrice(item.unitPrice)}</span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  item.modifiers.map((mod) => (
                    <div key={mod.id} className={styles.modifierLine}>
                      <span>  + {mod.name}</span>
                      {mod.price > 0 && <span>+{formatPrice(mod.price)}</span>}
                    </div>
                  ))
                )}
                {item.notes && (
                  <div className={styles.noteLine}>
                    <span>  * {item.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.divider}>{'─'.repeat(35)}</div>

          {/* Totals */}
          <div className={styles.totalsSection}>
            <div className={styles.receiptLine}>
              <span>Разом</span>
              <span>{formatPrice(order.subtotal)}{'\u20B4'}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className={styles.receiptLine}>
                <span>Знижка</span>
                <span>-{formatPrice(order.discountAmount)}{'\u20B4'}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className={styles.receiptLine}>
                <span>ПДВ</span>
                <span>{formatPrice(order.taxAmount)}{'\u20B4'}</span>
              </div>
            )}
            <div className={`${styles.receiptLine} ${styles.totalLine}`}>
              <span>До сплати</span>
              <span>{formatPrice(order.total)}{'\u20B4'}</span>
            </div>
          </div>

          <div className={styles.divider}>{'─'.repeat(35)}</div>

          {/* Payment info */}
          <div className={styles.paymentSection}>
            <div className={styles.receiptLine}>
              <span>Оплата</span>
              <span>{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
            </div>
            {payment.receivedAmount && payment.receivedAmount > 0 && (
              <div className={styles.receiptLine}>
                <span>Отримано</span>
                <span>{formatPrice(payment.receivedAmount)}{'\u20B4'}</span>
              </div>
            )}
            {payment.changeAmount > 0 && (
              <div className={styles.receiptLine}>
                <span>Решта</span>
                <span>{formatPrice(payment.changeAmount)}{'\u20B4'}</span>
              </div>
            )}
          </div>

          <div className={styles.divider}>{'─'.repeat(35)}</div>

          {/* Footer */}
          <div className={styles.receiptFooter}>
            <div className={styles.thankYou}>Дякуємо за візит!</div>
            <div className={styles.separator}>{'='.repeat(35)}</div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
