'use client';

/**
 * CoffeePOS - ShiftGuard Component
 *
 * Wraps POS page to require an open shift before accepting orders
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useShiftStore, useNotificationStore } from '@/lib/store';
import { Text, Button, Icon, Input } from '@/components/atoms';
import styles from './ShiftGuard.module.css';

interface ShiftGuardProps {
  children: ReactNode;
}

export function ShiftGuard({ children }: ShiftGuardProps) {
  const {
    currentShift,
    isShiftLoading,
    fetchCurrentShift,
    openShift,
    isShiftOpen,
    shouldRemindToClose,
  } = useShiftStore();

  const [openingCash, setOpeningCash] = useState('');
  const [baristaName, setBaristaName] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [mounted, setMounted] = useState(false);

  // All hooks MUST be declared before any conditional returns
  const shiftWarningFired = useRef(false);

  useEffect(() => {
    setMounted(true);
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  // Push shift warning into notification center (once)
  useEffect(() => {
    if (mounted && isShiftOpen() && shouldRemindToClose() && !shiftWarningFired.current) {
      shiftWarningFired.current = true;
      useNotificationStore.getState().addNotification({
        type: 'warning',
        priority: 'high',
        title: 'Зміна відкрита надто довго',
        message: 'Зміна відкрита понад 22 години. Рекомендуємо закрити зміну.',
        actionUrl: '/profile',
        actionLabel: 'Закрити зміну',
      });
    }
  }, [mounted, isShiftOpen, shouldRemindToClose]);

  const handleOpenShift = async () => {
    if (!baristaName.trim()) return;
    setIsOpening(true);
    await openShift(parseFloat(openingCash) || 0, baristaName.trim());
    setIsOpening(false);
  };

  // Prevent hydration mismatch — always render loading on first server/client render
  if (!mounted || (isShiftLoading && !currentShift)) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <Text variant="bodyMedium" color="secondary">Перевірка зміни...</Text>
      </div>
    );
  }

  // No open shift - show modal
  if (!isShiftOpen()) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <div className={styles.iconWrapper}>
              <Icon name="clock" size="xl" />
            </div>
            <Text variant="h3" weight="bold">Відкрити зміну</Text>
            <Text variant="bodyMedium" color="secondary">
              Для роботи з касою необхідно відкрити зміну
            </Text>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <Input
                label="Ім'я баристи"
                type="text"
                fullWidth
                placeholder="Введіть ім'я..."
                value={baristaName}
                onChange={(e) => setBaristaName(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <Input
                label="Готівка в касі (₴)"
                type="number"
                fullWidth
                placeholder="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenShift}
              disabled={!baristaName.trim() || isOpening}
            >
              {isOpening ? 'Відкриваємо...' : 'Відкрити зміну'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Shift open - show content
  return <>{children}</>;
}

export default ShiftGuard;
