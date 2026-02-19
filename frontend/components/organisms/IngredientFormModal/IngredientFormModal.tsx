'use client';

/**
 * CoffeePOS - IngredientFormModal Component
 *
 * Modal form for creating and editing ingredients.
 * Supports both CREATE and EDIT modes.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Text, Button, Input, Modal } from '@/components/atoms';
import { ingredientsApi } from '@/lib/api';
import type { Ingredient, IngredientInput, IngredientCategory, IngredientUnit } from '@/lib/api';
import styles from './IngredientFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface IngredientFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Ingredient to edit (null = create mode) */
  ingredient?: Ingredient | null;
  /** Available ingredient categories */
  categories: IngredientCategory[];
  /** Callback on successful create/update */
  onSuccess: () => void;
}

interface IngredientFormState {
  name: string;
  unit: IngredientUnit;
  quantity: string;
  minQuantity: string;
  costPerUnit: string;
  supplier: string;
  category: string;
  isActive: boolean;
}

const INITIAL_STATE: IngredientFormState = {
  name: '',
  unit: 'g',
  quantity: '0',
  minQuantity: '0',
  costPerUnit: '0',
  supplier: '',
  category: '',
  isActive: true,
};

const UNIT_OPTIONS: { value: IngredientUnit; label: string }[] = [
  { value: 'g', label: 'Грами (г)' },
  { value: 'kg', label: 'Кілограми (кг)' },
  { value: 'ml', label: 'Мілілітри (мл)' },
  { value: 'l', label: 'Літри (л)' },
  { value: 'pcs', label: 'Штуки (шт)' },
  { value: 'portion', label: 'Порції (порц)' },
];

// ============================================
// COMPONENT
// ============================================

export function IngredientFormModal({
  isOpen,
  onClose,
  ingredient,
  categories,
  onSuccess,
}: IngredientFormModalProps) {
  const isEditMode = !!ingredient;
  const [form, setForm] = useState<IngredientFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof IngredientFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name || '',
        unit: ingredient.unit || 'g',
        quantity: String(ingredient.quantity ?? 0),
        minQuantity: String(ingredient.minQuantity ?? 0),
        costPerUnit: String(ingredient.costPerUnit ?? 0),
        supplier: ingredient.supplier || '',
        category: ingredient.category?.id ? String(ingredient.category.id) : '',
        isActive: ingredient.isActive ?? true,
      });
    } else {
      setForm(INITIAL_STATE);
    }
    setErrors({});
    setSubmitError(null);
  }, [ingredient, isOpen]);

  const handleChange = useCallback(
    (field: keyof IngredientFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const newErrors: Partial<Record<keyof IngredientFormState, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Назва обов\'язкова';
    }
    if (!form.unit) {
      newErrors.unit = 'Одиниця виміру обов\'язкова';
    }
    if (form.quantity && Number(form.quantity) < 0) {
      newErrors.quantity = 'Кількість не може бути від\'ємною';
    }
    if (form.minQuantity && Number(form.minQuantity) < 0) {
      newErrors.minQuantity = 'Мін. запас не може бути від\'ємним';
    }
    if (form.costPerUnit && Number(form.costPerUnit) < 0) {
      newErrors.costPerUnit = 'Вартість не може бути від\'ємною';
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

      const data: IngredientInput = {
        name: form.name.trim(),
        unit: form.unit,
        quantity: form.quantity ? Number(form.quantity) : 0,
        minQuantity: form.minQuantity ? Number(form.minQuantity) : 0,
        costPerUnit: form.costPerUnit ? Number(form.costPerUnit) : 0,
        supplier: form.supplier.trim() || undefined,
        category: form.category ? Number(form.category) : undefined,
        isActive: form.isActive,
      };

      try {
        if (isEditMode && ingredient) {
          await ingredientsApi.update(ingredient.documentId, data);
        } else {
          await ingredientsApi.create(data);
        }
        onSuccess();
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Помилка збереження інгредієнта'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, ingredient, validate, onSuccess, onClose]
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
      title={isEditMode ? 'Редагувати інгредієнт' : 'Новий інгредієнт'}
      icon="package"
      size="lg"
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
          placeholder="Введіть назву інгредієнта"
          error={!!errors.name}
          errorMessage={errors.name}
          fullWidth
        />

        {/* Unit + Category */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Одиниця виміру *</label>
            <select
              className={styles.select}
              value={form.unit}
              onChange={handleChange('unit')}
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.unit && (
              <span className={styles.errorText}>{errors.unit}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Категорія</label>
            <select
              className={styles.select}
              value={form.category}
              onChange={handleChange('category')}
            >
              <option value="">-- Без категорії --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity + Min Quantity */}
        <div className={styles.row}>
          <Input
            label="Кількість на складі"
            type="number"
            min="0"
            step="0.01"
            value={form.quantity}
            onChange={handleChange('quantity')}
            placeholder="0"
            error={!!errors.quantity}
            errorMessage={errors.quantity}
            fullWidth
          />
          <Input
            label="Мін. запас (поріг)"
            type="number"
            min="0"
            step="0.01"
            value={form.minQuantity}
            onChange={handleChange('minQuantity')}
            placeholder="0"
            error={!!errors.minQuantity}
            errorMessage={errors.minQuantity}
            fullWidth
          />
        </div>

        {/* Cost per unit */}
        <Input
          label="Вартість за одиницю (грн)"
          type="number"
          min="0"
          step="0.01"
          value={form.costPerUnit}
          onChange={handleChange('costPerUnit')}
          placeholder="0.00"
          error={!!errors.costPerUnit}
          errorMessage={errors.costPerUnit}
          fullWidth
        />

        {/* Supplier */}
        <Input
          label="Постачальник"
          value={form.supplier}
          onChange={handleChange('supplier')}
          placeholder="Назва постачальника"
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
            <span className={styles.toggleLabel}>Активний</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default IngredientFormModal;
