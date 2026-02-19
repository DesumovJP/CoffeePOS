'use client';

/**
 * CoffeePOS - TableFormModal Component
 *
 * Create/edit cafe tables
 */

import { useState, useEffect } from 'react';
import { Text, Button, Icon, Input } from '@/components/atoms';
import { Modal } from '@/components/atoms/Modal';
import { tablesApi } from '@/lib/api';
import type { CafeTable } from '@/lib/api/types';
import styles from './TableFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  table?: CafeTable | null;
  onSuccess: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function TableFormModal({
  isOpen,
  onClose,
  table,
  onSuccess,
}: TableFormModalProps) {
  const isEditing = !!table;

  // Form state
  const [number, setNumber] = useState<string>('');
  const [seats, setSeats] = useState<string>('4');
  const [zone, setZone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (table) {
        setNumber(String(table.number));
        setSeats(String(table.seats));
        setZone(table.zone || '');
        setIsActive(table.isActive ?? true);
        setSortOrder(String(table.sortOrder ?? 0));
      } else {
        setNumber('');
        setSeats('4');
        setZone('');
        setIsActive(true);
        setSortOrder('0');
      }
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, table]);

  // Submit handler
  const handleSubmit = async () => {
    setError(null);

    const numVal = parseInt(number);
    if (!number || isNaN(numVal) || numVal <= 0) {
      setError('Вкажіть номер столу');
      return;
    }

    const seatsVal = parseInt(seats);
    if (!seats || isNaN(seatsVal) || seatsVal <= 0) {
      setError('Вкажіть кількість місць');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        number: numVal,
        seats: seatsVal,
        zone: zone.trim() || undefined,
        isActive,
        sortOrder: parseInt(sortOrder) || 0,
      };

      if (isEditing && table) {
        await tablesApi.update(table.documentId, payload);
      } else {
        await tablesApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Помилка збереження');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <Button
      variant="primary"
      size="lg"
      onClick={handleSubmit}
      loading={submitting}
      fullWidth
    >
      <Icon name="check" size="md" />
      {isEditing ? 'Зберегти' : 'Створити'}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Редагувати стіл #${table?.number}` : 'Новий стіл'}
      subtitle="Налаштуйте параметри столу"
      icon="store"
      size="sm"
      footer={footer}
    >
      <div className={styles.form}>
        {error && (
          <div className={styles.errorBanner}>
            <Icon name="warning" size="sm" color="error" />
            <Text variant="bodySmall" color="error">{error}</Text>
          </div>
        )}

        <div className={styles.row}>
          <Input
            label="Номер столу"
            type="number"
            placeholder="1"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            min={1}
            fullWidth
          />
          <Input
            label="Кількість місць"
            type="number"
            placeholder="4"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            min={1}
            fullWidth
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Зона"
            placeholder="Зал, Тераса, VIP..."
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            fullWidth
          />
          <Input
            label="Порядок сортування"
            type="number"
            placeholder="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
            fullWidth
          />
        </div>

        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className={styles.checkbox}
            />
            <Text variant="bodyMedium">Активний</Text>
          </label>
          <Text variant="caption" color="tertiary">
            Неактивні столи не відображаються в POS
          </Text>
        </div>
      </div>
    </Modal>
  );
}
