'use client';

/**
 * CoffeePOS - IngredientCategoryFormModal Component
 *
 * Modal form for creating and editing ingredient categories.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Text, Button, Input, Modal, Icon } from '@/components/atoms';
import { ingredientCategoriesApi } from '@/lib/api';
import type { IngredientCategory } from '@/lib/api';
import { emitToast } from '@/lib/toastBridge';
import styles from '../CategoryFormModal/CategoryFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface IngredientCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: IngredientCategory | null;
  onSuccess: () => void;
  onDelete?: () => void;
}

interface FormState {
  name: string;
  sortOrder: string;
  isActive: boolean;
}

const INITIAL_STATE: FormState = {
  name: '',
  sortOrder: '0',
  isActive: true,
};

// ============================================
// COMPONENT
// ============================================

export function IngredientCategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
  onDelete,
}: IngredientCategoryFormModalProps) {
  const isEditMode = !!category;
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        sortOrder: String(category.sortOrder ?? 0),
        isActive: category.isActive ?? true,
      });
    } else {
      setForm(INITIAL_STATE);
    }
    setErrors({});
    setSubmitError(null);
  }, [category, isOpen]);

  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) {
      newErrors.name = 'Назва обов\'язкова';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      setSubmitError(null);

      const data = {
        name: form.name.trim(),
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
        isActive: form.isActive,
      };

      try {
        if (isEditMode && category) {
          await ingredientCategoriesApi.update(category.documentId, data);
          emitToast({ type: 'success', title: 'Категорію оновлено', message: data.name, duration: 3000 });
        } else {
          await ingredientCategoriesApi.create(data);
          emitToast({ type: 'success', title: 'Категорію створено', message: data.name, duration: 3000 });
        }
        onSuccess();
        onClose();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Помилка збереження категорії';
        setSubmitError(msg);
        emitToast({ type: 'error', title: isEditMode ? 'Не вдалось оновити категорію' : 'Не вдалось створити категорію', message: msg, duration: 4000 });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, category, validate, onSuccess, onClose]
  );

  const footer = (
    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
      {isEditMode && onDelete && (
        <Button variant="ghost" size="md" onClick={onDelete} style={{ flex: 1 }}>
          <Icon name="delete" size="sm" /> Видалити
        </Button>
      )}
      <Button
        variant="primary"
        onClick={handleSubmit as any}
        loading={isSubmitting}
        style={{ flex: 1 }}
      >
        {isEditMode ? 'Зберегти' : 'Створити'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Редагувати категорію інгредієнтів' : 'Нова категорія інгредієнтів'}
      icon="store"
      size="sm"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div className={styles.errorBanner}>
            <Text variant="bodySmall" color="error">{submitError}</Text>
          </div>
        )}

        <Input
          label="Назва *"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Введіть назву категорії"
          error={!!errors.name}
          errorMessage={errors.name}
          fullWidth
        />

        <Input
          label="Порядок сортування"
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={handleChange('sortOrder')}
          placeholder="0"
          fullWidth
        />

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={handleChange('isActive')}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>Активна</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default IngredientCategoryFormModal;
