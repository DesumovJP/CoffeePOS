'use client';

/**
 * CoffeePOS - IngredientFormModal Component
 *
 * Modal form for creating and editing ingredients.
 * Supports both CREATE and EDIT modes.
 */

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { Text, Button, Input, Modal, Icon } from '@/components/atoms';
import { ingredientsApi, uploadFile } from '@/lib/api';
import type { Ingredient, IngredientInput, IngredientCategory, IngredientUnit } from '@/lib/api';
import type { Supplier } from '@/lib/api/suppliers';
import { emitToast } from '@/lib/toastBridge';
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
  /** Available suppliers for multi-select */
  suppliers?: Supplier[];
  /** Callback on successful create/update */
  onSuccess: () => void;
  /** Called when user clicks Delete (edit mode only) */
  onDelete?: () => void;
}

interface IngredientFormState {
  name: string;
  unit: IngredientUnit;
  quantity: string;
  minQuantity: string;
  costPerUnit: string;
  category: string;
  isActive: boolean;
}

const INITIAL_STATE: IngredientFormState = {
  name: '',
  unit: 'g',
  quantity: '0',
  minQuantity: '0',
  costPerUnit: '0',
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
  suppliers,
  onSuccess,
  onDelete,
}: IngredientFormModalProps) {
  const isEditMode = !!ingredient;
  const [form, setForm] = useState<IngredientFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof IngredientFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Image upload state
  const [imageId, setImageId] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppliers multi-select state
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);

  // Populate form when editing
  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name || '',
        unit: ingredient.unit || 'g',
        quantity: String(ingredient.quantity ?? 0),
        minQuantity: String(ingredient.minQuantity ?? 0),
        costPerUnit: String(ingredient.costPerUnit ?? 0),
        category: ingredient.category?.id ? String(ingredient.category.id) : '',
        isActive: ingredient.isActive ?? true,
      });
      setSelectedSupplierIds(
        ingredient.suppliers?.map((s) => s.id) || []
      );
      setImageId(ingredient.image?.id ?? null);
      setImagePreview(ingredient.image?.url ?? null);
    } else {
      setForm(INITIAL_STATE);
      setSelectedSupplierIds([]);
      setImageId(null);
      setImagePreview(null);
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

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file.type.startsWith('image/')) {
      setSubmitError('Оберіть файл зображення (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Розмір файлу не повинен перевищувати 5 МБ');
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setSubmitError(null);
    try {
      setIsUploading(true);
      const uploaded = await uploadFile(file);
      setImageId(uploaded.id);
      setImagePreview(uploaded.url);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Помилка завантаження');
      setImageId(null);
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageId(null);
    setImagePreview(null);
  }, []);

  const toggleSupplier = useCallback((supplierId: number) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  }, []);

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
        suppliers: selectedSupplierIds.length > 0
          ? { connect: selectedSupplierIds.map((id) => ({ id })) }
          : undefined,
        category: form.category ? Number(form.category) : undefined,
        isActive: form.isActive,
        image: imageId ?? undefined,
      };

      try {
        if (isEditMode && ingredient) {
          await ingredientsApi.update(ingredient.documentId, data);
          emitToast({ type: 'success', title: 'Інгредієнт оновлено', message: data.name, duration: 3000 });
        } else {
          await ingredientsApi.create(data);
          emitToast({ type: 'success', title: 'Інгредієнт створено', message: data.name, duration: 3000 });
        }
        onSuccess();
        onClose();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Помилка збереження інгредієнта';
        setSubmitError(msg);
        emitToast({ type: 'error', title: isEditMode ? 'Не вдалось оновити інгредієнт' : 'Не вдалось створити інгредієнт', message: msg, duration: 4000 });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, ingredient, selectedSupplierIds, validate, onSuccess, onClose, imageId]
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

        {/* Image upload */}
        <div className={styles.field}>
          <label className={styles.label}>Зображення</label>
          <div className={styles.imageUpload}>
            <button
              type="button"
              className={styles.imageArea}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Завантажити зображення"
            >
              {isUploading ? (
                <span className={styles.uploadSpinner} />
              ) : imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className={styles.imageThumb} />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <Icon name="upload" size="lg" color="tertiary" />
                  <Text variant="caption" color="tertiary">Фото</Text>
                </div>
              )}
            </button>
            <div className={styles.imageHint}>
              <Text variant="caption" color="tertiary">JPG, PNG, WebP · до 5 МБ</Text>
              {imageId && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={handleRemoveImage}
                >
                  Видалити
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleImageSelect}
          />
        </div>

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

        {/* Suppliers multi-select */}
        {suppliers && suppliers.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Постачальники</label>
            <div className={styles.tagInputWrapper}>
              {suppliers.map((sup) => (
                <button
                  key={sup.id}
                  type="button"
                  className={`${styles.supplierTag} ${selectedSupplierIds.includes(sup.id) ? styles.supplierTagActive : ''}`}
                  onClick={() => toggleSupplier(sup.id)}
                >
                  {sup.name}
                  {selectedSupplierIds.includes(sup.id) && (
                    <Icon name="check" size="xs" />
                  )}
                </button>
              ))}
            </div>
            <Text variant="caption" color="tertiary">
              Оберіть одного або кількох постачальників
            </Text>
          </div>
        )}

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
