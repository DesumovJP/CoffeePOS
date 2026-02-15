'use client';

/**
 * CoffeePOS - ShiftCloseModal Component
 *
 * Modal for closing the current shift with summary
 */

import { useState } from 'react';
import { useShiftStore } from '@/lib/store';
import { Modal } from '@/components/atoms';
import { Text, Button, Icon, Input } from '@/components/atoms';
import styles from './ShiftCloseModal.module.css';

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftCloseModal({ isOpen, onClose }: ShiftCloseModalProps) {
  const { currentShift, closeShift } = useShiftStore();
  const [closingCash, setClosingCash] = useState('');
  const [closedBy, setClosedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  if (!currentShift) return null;

  const expectedCash = (currentShift.openingCash || 0) + (currentShift.cashSales || 0);
  const actualCash = parseFloat(closingCash) || 0;
  const difference = actualCash - expectedCash;

  const handleClose = async () => {
    if (!closedBy.trim()) return;
    setIsClosing(true);
    const success = await closeShift(actualCash, closedBy.trim(), notes || undefined);
    setIsClosing(false);
    if (success) {
      setClosingCash('');
      setClosedBy('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Закрити зміну"
      icon="clock"
      size="md"
    >
      <div className={styles.content}>
        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Відкрив</Text>
            <Text variant="labelMedium" weight="semibold">{currentShift.openedBy}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Готівка продажі</Text>
            <Text variant="labelMedium" weight="semibold" color="success">₴{(currentShift.cashSales || 0).toFixed(2)}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Картка продажі</Text>
            <Text variant="labelMedium" weight="semibold" color="accent">₴{(currentShift.cardSales || 0).toFixed(2)}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Замовлень</Text>
            <Text variant="labelMedium" weight="semibold">{currentShift.ordersCount || 0}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Списання</Text>
            <Text variant="labelMedium" weight="semibold" color="error">-₴{(currentShift.writeOffsTotal || 0).toFixed(2)}</Text>
          </div>

          <div className={styles.divider} />

          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Каса на початку</Text>
            <Text variant="labelMedium" weight="semibold">₴{(currentShift.openingCash || 0).toFixed(2)}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text variant="bodySmall" color="secondary">Очікувана готівка</Text>
            <Text variant="labelMedium" weight="bold">₴{expectedCash.toFixed(2)}</Text>
          </div>
        </div>

        {/* Form */}
        <div className={styles.form}>
          <div className={styles.field}>
            <Input
              label="Ім'я (хто закриває)"
              type="text"
              fullWidth
              placeholder="Введіть ім'я..."
              value={closedBy}
              onChange={(e) => setClosedBy(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Input
              label="Фактична готівка в касі (₴)"
              type="number"
              fullWidth
              placeholder="0"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              min="0"
              step="0.01"
            />
            {closingCash && (
              <div className={styles.difference}>
                <Text
                  variant="labelSmall"
                  color={difference === 0 ? 'secondary' : difference > 0 ? 'success' : 'error'}
                >
                  Різниця: {difference === 0 ? '—' : difference > 0 ? `+₴${difference.toFixed(2)}` : `-₴${Math.abs(difference).toFixed(2)}`}
                </Text>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <Text variant="labelMedium" weight="medium">Примітки (необов&apos;язково)</Text>
            <textarea
              className={styles.textarea}
              placeholder="Примітки до зміни..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleClose}
            disabled={!closedBy.trim() || isClosing}
          >
            {isClosing ? 'Закриваємо...' : 'Закрити зміну'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ShiftCloseModal;
