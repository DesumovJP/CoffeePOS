'use client';

/**
 * CoffeePOS - PaymentModal Component
 *
 * Payment method selection and processing.
 * After successful payment, shows a success screen with option to print receipt.
 */

import { forwardRef, useState, useEffect, type HTMLAttributes } from 'react';
import { Text, Button, Icon, Divider, type IconName } from '@/components/atoms';
import { Modal } from '@/components/atoms/Modal';
import styles from './PaymentModal.module.css';

// ============================================
// TYPES
// ============================================

export type PaymentMethod = 'cash' | 'card' | 'qr';

export interface PaymentModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Total amount to pay */
  total: number;
  /** Currency symbol */
  currency?: string;
  /** Callback when payment is complete */
  onPaymentComplete: (method: PaymentMethod, received?: number) => void;
  /** Available payment methods */
  availableMethods?: PaymentMethod[];
  /** Processing state */
  processing?: boolean;
  /** Callback to print receipt (if provided, shows print button after success) */
  onPrintReceipt?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: IconName; description: string }> = {
  cash: { label: 'Готівка', icon: 'cash', description: 'Оплата готівкою' },
  card: { label: 'Картка', icon: 'card', description: 'Банківська картка' },
  qr: { label: 'QR-код', icon: 'qr', description: 'Сканувати QR' },
};

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(2)}`;
}

// ============================================
// COMPONENT
// ============================================

export const PaymentModal = forwardRef<HTMLDivElement, PaymentModalProps>(
  (
    {
      open,
      onClose,
      total,
      currency = '₴',
      onPaymentComplete,
      availableMethods = ['cash', 'card', 'qr'],
      processing = false,
      onPrintReceipt,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [successMethod, setSuccessMethod] = useState<PaymentMethod>('cash');

    // Reset state when modal closes
    useEffect(() => {
      if (!open) {
        setSelectedMethod('cash');
        setPaymentSuccess(false);
      }
    }, [open]);

    const handleClose = () => {
      setSelectedMethod('cash');
      setPaymentSuccess(false);
      onClose();
    };

    const handleComplete = () => {
      setSuccessMethod(selectedMethod);
      setPaymentSuccess(true);
      onPaymentComplete(selectedMethod);
    };

    // SUCCESS STATE
    if (paymentSuccess) {
      const successFooter = (
        <>
          {onPrintReceipt && (
            <Button variant="secondary" size="lg" onClick={onPrintReceipt}>
              <Icon name="printer" size="md" />
              Друкувати чек
            </Button>
          )}
          <Button variant="primary" size="lg" fullWidth onClick={handleClose}>
            Нове замовлення
          </Button>
        </>
      );

      return (
        <Modal
          ref={ref}
          open={open}
          onClose={handleClose}
          title="Оплата завершена"
          size="md"
          footer={successFooter}
          className={className}
          {...props}
        >
          <div className={styles.content}>
            <div className={styles.successSection}>
              <div className={styles.successIcon}>
                <Icon name="success" size="2xl" color="success" />
              </div>
              <Text variant="h3" weight="bold" color="success" align="center">
                Оплачено!
              </Text>
              <Text variant="displaySmall" weight="bold" align="center">
                {formatPrice(total, currency)}
              </Text>
              <Text variant="bodyMedium" color="secondary" align="center">
                {PAYMENT_METHODS[successMethod].label}
              </Text>
            </div>
          </div>
        </Modal>
      );
    }

    // PAYMENT FORM STATE
    const footer = (
      <Button
        variant="success"
        size="lg"
        onClick={handleComplete}
        loading={processing}
        fullWidth
      >
        <Icon name="check" size="md" />
        Підтвердити оплату
      </Button>
    );

    return (
      <Modal
        ref={ref}
        open={open}
        onClose={handleClose}
        title="Оплата"
        size="md"
        footer={footer}
        className={className}
        {...props}
      >
        <div className={styles.content}>
          {/* Total */}
          <div className={styles.totalSection}>
            <Text variant="labelMedium" color="secondary">
              До сплати
            </Text>
            <Text variant="displaySmall" color="primary" weight="bold">
              {formatPrice(total, currency)}
            </Text>
          </div>

          <Divider spacing="md" />

          {/* Payment methods */}
          <div className={styles.methodsSection}>
            <Text variant="labelMedium" color="secondary">
              Спосіб оплати
            </Text>
            <div className={styles.methods}>
              {availableMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`${styles.methodCard} ${selectedMethod === method ? styles.selected : ''}`}
                  onClick={() => setSelectedMethod(method)}
                >
                  <Icon
                    name={PAYMENT_METHODS[method].icon}
                    size="xl"
                    color={selectedMethod === method ? 'accent' : 'secondary'}
                  />
                  <Text
                    variant="labelLarge"
                    color={selectedMethod === method ? 'primary' : 'secondary'}
                  >
                    {PAYMENT_METHODS[method].label}
                  </Text>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
);

PaymentModal.displayName = 'PaymentModal';
