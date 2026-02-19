'use client';

/**
 * CoffeePOS - CategoryFormModal Component
 *
 * Modal form for creating and editing product categories.
 * Supports both CREATE and EDIT modes.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Text, Button, Input, Modal } from '@/components/atoms';
import { categoriesApi } from '@/lib/api';
import type { Category, CategoryInput } from '@/lib/api';
import styles from './CategoryFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface CategoryFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Category to edit (null = create mode) */
  category?: Category | null;
  /** Callback on successful create/update */
  onSuccess: () => void;
}

interface CategoryFormState {
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: string;
  isActive: boolean;
}

const INITIAL_STATE: CategoryFormState = {
  name: '',
  description: '',
  icon: '',
  color: '#4a90d9',
  sortOrder: '0',
  isActive: true,
};

// ============================================
// COMPONENT
// ============================================

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryFormModalProps) {
  const isEditMode = !!category;
  const [form, setForm] = useState<CategoryFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#4a90d9',
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
    (field: keyof CategoryFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
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
    const newErrors: Partial<Record<keyof CategoryFormState, string>> = {};

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

      const data: CategoryInput = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        color: form.color || undefined,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
        isActive: form.isActive,
      };

      try {
        if (isEditMode && category) {
          await categoriesApi.update(category.documentId, data);
        } else {
          await categoriesApi.create(data);
        }
        onSuccess();
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Помилка збереження категорії'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, category, validate, onSuccess, onClose]
  );

  const footer = (
    <Button
      variant="primary"
      onClick={handleSubmit as any}
      loading={isSubmitting}
      fullWidth
    >
      {isEditMode ? 'Зберегти' : 'Створити'}
    </Button>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Редагувати категорію' : 'Нова категорія'}
      icon="store"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div className={styles.errorBanner}>
            <Text variant="bodySmall" color="error">{submitError}</Text>
          </div>
        )}

        {/* Name */}
        <Input
          label="Назва *"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Введіть назву категорії"
          error={!!errors.name}
          errorMessage={errors.name}
          fullWidth
        />

        {/* Description */}
        <div className={styles.field}>
          <label className={styles.label}>Опис</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Опис категорії"
            rows={3}
          />
        </div>

        {/* Icon + Color */}
        <div className={styles.row}>
          <Input
            label="Іконка (емодзі)"
            value={form.icon}
            onChange={handleChange('icon')}
            placeholder="&#9749;"
            fullWidth
          />
          <div className={styles.field}>
            <label className={styles.label}>Колір</label>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                className={styles.colorInput}
                value={form.color}
                onChange={handleChange('color')}
              />
              <Input
                value={form.color}
                onChange={handleChange('color')}
                placeholder="#4a90d9"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Sort Order */}
        <Input
          label="Порядок сортування"
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={handleChange('sortOrder')}
          placeholder="0"
          fullWidth
        />

        {/* Active toggle */}
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

export default CategoryFormModal;
