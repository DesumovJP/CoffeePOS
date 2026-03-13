'use client';

/**
 * CoffeePOS - SupplierFormModal
 *
 * Create or edit a Supplier entity with full contact details.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Text, Button, Input, Modal } from '@/components/atoms';
import { suppliersApi } from '@/lib/api';
import type { Supplier, SupplierCreateData } from '@/lib/api';
import styles from './SupplierFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  contactPerson: string;
  phone: string;
  telegram: string;
  email: string;
  website: string;
  address: string;
  category: string;
  paymentTerms: string;
  notes: string;
  reorderEveryDays: string;
  minimumOrderAmount: string;
  isActive: boolean;
}

const INITIAL_STATE: FormState = {
  name: '',
  contactPerson: '',
  phone: '',
  telegram: '',
  email: '',
  website: '',
  address: '',
  category: '',
  paymentTerms: '',
  notes: '',
  reorderEveryDays: '',
  minimumOrderAmount: '',
  isActive: true,
};

const CATEGORY_OPTIONS = [
  'Кава та зернові',
  'Молочні продукти',
  'Сиропи та топінги',
  'Пакування',
  'Харчові продукти',
  'Напої',
  'Інше',
];

// ============================================
// COMPONENT
// ============================================

export function SupplierFormModal({ isOpen, onClose, supplier, onSuccess }: SupplierFormModalProps) {
  const isEditMode = !!supplier;
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        telegram: supplier.telegram || '',
        email: supplier.email || '',
        website: supplier.website || '',
        address: supplier.address || '',
        category: supplier.category || '',
        paymentTerms: supplier.paymentTerms || '',
        notes: supplier.notes || '',
        reorderEveryDays: supplier.reorderEveryDays ? String(supplier.reorderEveryDays) : '',
        minimumOrderAmount: supplier.minimumOrderAmount ? String(supplier.minimumOrderAmount) : '',
        isActive: supplier.isActive ?? true,
      });
    } else {
      setForm(INITIAL_STATE);
    }
    setErrors({});
    setSubmitError(null);
  }, [supplier, isOpen]);

  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
          setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
        }
      },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Назва обов'язкова";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const data: SupplierCreateData = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      telegram: form.telegram.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      address: form.address.trim() || undefined,
      category: form.category || undefined,
      paymentTerms: form.paymentTerms.trim() || undefined,
      notes: form.notes.trim() || undefined,
      reorderEveryDays: form.reorderEveryDays ? Number(form.reorderEveryDays) : undefined,
      minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined,
      isActive: form.isActive,
    };

    try {
      if (isEditMode && supplier) {
        await suppliersApi.update(supplier.documentId, data);
      } else {
        await suppliersApi.create(data);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Помилка збереження постачальника');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isEditMode, supplier, validate, onSuccess, onClose]);

  const footer = (
    <Button variant="primary" onClick={handleSubmit as any} loading={isSubmitting} fullWidth>
      {isEditMode ? 'Зберегти' : 'Додати постачальника'}
    </Button>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Редагувати постачальника' : 'Новий постачальник'}
      icon="truck"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div className={styles.errorBanner}>
            <Text variant="bodySmall" color="error">{submitError}</Text>
          </div>
        )}

        <Input
          label="Назва постачальника *"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Напр. ТОВ «Кавовий дім»"
          error={!!errors.name}
          errorMessage={errors.name}
          fullWidth
        />

        <div className={styles.row}>
          <Input
            label="Контактна особа"
            value={form.contactPerson}
            onChange={handleChange('contactPerson')}
            placeholder="Ім'я менеджера"
            fullWidth
          />
          <div className={styles.field}>
            <label className={styles.label}>Категорія</label>
            <select className={styles.select} value={form.category} onChange={handleChange('category')}>
              <option value="">— Оберіть категорію —</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.sectionLabel}>Контакти</div>

        <div className={styles.row}>
          <Input
            label="Телефон"
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+380 67 000 0000"
            fullWidth
          />
          <Input
            label="Telegram"
            value={form.telegram}
            onChange={handleChange('telegram')}
            placeholder="@username або +380..."
            fullWidth
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="supplier@example.com"
            fullWidth
          />
          <Input
            label="Сайт"
            value={form.website}
            onChange={handleChange('website')}
            placeholder="https://example.com"
            fullWidth
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Адреса</label>
          <textarea
            className={styles.textarea}
            value={form.address}
            onChange={handleChange('address')}
            placeholder="Вулиця, місто"
            rows={2}
          />
        </div>

        <div className={styles.sectionLabel}>Умови роботи</div>

        <div className={styles.row}>
          <Input
            label="Умови оплати"
            value={form.paymentTerms}
            onChange={handleChange('paymentTerms')}
            placeholder="Передоплата / Net-14"
            fullWidth
          />
          <Input
            label="Мін. замовлення (₴)"
            type="number"
            min="0"
            value={form.minimumOrderAmount}
            onChange={handleChange('minimumOrderAmount')}
            placeholder="0"
            fullWidth
          />
        </div>

        <Input
          label="Замовляти кожні N днів"
          type="number"
          min="1"
          max="365"
          value={form.reorderEveryDays}
          onChange={handleChange('reorderEveryDays')}
          placeholder="7, 14, 30..."
          fullWidth
        />

        <div className={styles.field}>
          <label className={styles.label}>Нотатки</label>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={handleChange('notes')}
            placeholder="Особливості роботи, режим роботи, тощо"
            rows={3}
          />
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={handleChange('isActive')}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>Активний постачальник</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default SupplierFormModal;
