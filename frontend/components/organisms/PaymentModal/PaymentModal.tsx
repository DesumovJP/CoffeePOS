'use client';

/**
 * CoffeePOS - PaymentModal Component
 *
 * Payment method selection and processing.
 * After successful payment, shows a success screen with option to print receipt.
 */

import { forwardRef, useState, useEffect, type HTMLAttributes } from 'react';
import { Text, Button, Icon, GlassCard, Input, Divider, type IconName } from '@/components/atoms';
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

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

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
    const [cashReceived, setCashReceived] = useState<string>('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [successMethod, setSuccessMethod] = useState<PaymentMethod>('cash');
    const [successChange, setSuccessChange] = useState(0);

    const receivedAmount = parseFloat(cashReceived) || 0;
    const change = receivedAmount - total;
    const canComplete = selectedMethod !== 'cash' || receivedAmount >= total;

    // Reset state when modal closes
    useEffect(() => {
      if (!open) {
        setCashReceived('');
        setSelectedMethod('cash');
        setPaymentSuccess(false);
      }
    }, [open]);

    // Reset state when modal opens
    const handleClose = () => {
      setCashReceived('');
      setSelectedMethod('cash');
      setPaymentSuccess(false);
      onClose();
    };

    const handleComplete = () => {
      const method = selectedMethod;
      const received = method === 'cash' ? receivedAmount : undefined;
      const changeAmount = method === 'cash' ? Math.max(0, receivedAmount - total) : 0;

      setSuccessMethod(method);
      setSuccessChange(changeAmount);
      setPaymentSuccess(true);

      if (method === 'cash') {
        onPaymentComplete('cash', receivedAmount);
      } else {
        onPaymentComplete(method);
      }
    };

    const handleQuickAmount = (amount: number) => {
      setCashReceived(amount.toString());
    };

    const handleExactAmount = () => {
      setCashReceived(total.toFixed(2));
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
              {successMethod === 'cash' && successChange > 0 && (
                <GlassCard intensity="subtle" padding="md" className={`${styles.changeCard} ${styles.positive}`}>
                  <Text variant="labelMedium" color="success">
                    Решта
                  </Text>
                  <Text variant="h3" color="success" weight="bold">
                    {formatPrice(successChange, currency)}
                  </Text>
                </GlassCard>
              )}
            </div>
          </div>
        </Modal>
      );
    }

    // PAYMENT FORM STATE
    const footer = (
      <>
        <Button variant="secondary" size="lg" onClick={handleClose}>
          Скасувати
        </Button>
        <Button
          variant="success"
          size="lg"
          onClick={handleComplete}
          disabled={!canComplete}
          loading={processing}
          fullWidth
        >
          <Icon name="check" size="md" />
          {selectedMethod === 'cash'
            ? `Завершити (решта ${formatPrice(Math.max(0, change), currency)})`
            : 'Підтвердити оплату'}
        </Button>
      </>
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

          {/* Cash input */}
          {selectedMethod === 'cash' && (
            <>
              <Divider spacing="md" />

              <div className={styles.cashSection}>
                <Text variant="labelMedium" color="secondary">
                  Отримано готівкою
                </Text>

                <Input
                  type="number"
                  size="lg"
                  variant="glass"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className={styles.cashInput}
                  min={0}
                  step={0.01}
                />

                {/* Quick amounts */}
                <div className={styles.quickAmounts}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExactAmount}
                  >
                    Без решти
                  </Button>
                  {QUICK_AMOUNTS.filter((a) => a >= total).slice(0, 4).map((amount) => (
                    <Button
                      key={amount}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                    >
                      {currency}{amount}
                    </Button>
                  ))}
                </div>

                {/* Change display */}
                {receivedAmount > 0 && (
                  <GlassCard
                    intensity="subtle"
                    padding="md"
                    className={`${styles.changeCard} ${change >= 0 ? styles.positive : styles.negative}`}
                  >
                    <Text variant="labelMedium" color={change >= 0 ? 'success' : 'error'}>
                      {change >= 0 ? 'Решта' : 'Недостатньо'}
                    </Text>
                    <Text
                      variant="h3"
                      color={change >= 0 ? 'success' : 'error'}
                      weight="bold"
                    >
                      {formatPrice(Math.abs(change), currency)}
                    </Text>
                  </GlassCard>
                )}
              </div>
            </>
          )}

          {/* Card/QR instructions */}
          {selectedMethod === 'card' && (
            <>
              <Divider spacing="md" />
              <GlassCard intensity="subtle" padding="lg" className={styles.instructions}>
                <Icon name="card" size="2xl" color="accent" />
                <Text variant="bodyMedium" color="secondary" align="center">
                  Прикладіть або вставте картку клієнта до терміналу
                </Text>
              </GlassCard>
            </>
          )}

          {selectedMethod === 'qr' && (
            <>
              <Divider spacing="md" />
              <GlassCard intensity="subtle" padding="lg" className={styles.instructions}>
                <div className={styles.qrPlaceholder}>
                  <Icon name="qr" size="2xl" color="tertiary" />
                </div>
                <Text variant="bodyMedium" color="secondary" align="center">
                  Покажіть QR-код клієнту для сканування
                </Text>
              </GlassCard>
            </>
          )}
        </div>
      </Modal>
    );
  }
);

PaymentModal.displayName = 'PaymentModal';
