'use client';

/**
 * CoffeePOS - ProductFormModal Component
 *
 * Modal form for creating and editing products.
 * Supports both CREATE and EDIT modes.
 */

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { Text, Button, Input, Icon, Modal } from '@/components/atoms';
import { productsApi, uploadFile } from '@/lib/api';
import type { Product, ProductInput, Category } from '@/lib/api';
import styles from './ProductFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface ProductFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Product to edit (null = create mode) */
  product?: Product | null;
  /** Available categories for the select */
  categories: Category[];
  /** Callback on successful create/update */
  onSuccess: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  costPrice: string;
  category: string;
  sku: string;
  barcode: string;
  isActive: boolean;
  isFeatured: boolean;
  preparationTime: string;
  trackInventory: boolean;
  stockQuantity: string;
  lowStockThreshold: string;
}

const INITIAL_STATE: ProductFormState = {
  name: '',
  description: '',
  price: '',
  costPrice: '',
  category: '',
  sku: '',
  barcode: '',
  isActive: true,
  isFeatured: false,
  preparationTime: '',
  trackInventory: false,
  stockQuantity: '0',
  lowStockThreshold: '5',
};

// ============================================
// COMPONENT
// ============================================

export function ProductFormModal({
  isOpen,
  onClose,
  product,
  categories,
  onSuccess,
}: ProductFormModalProps) {
  const isEditMode = !!product;
  const [form, setForm] = useState<ProductFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Image upload state
  const [imageId, setImageId] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: String(product.price ?? ''),
        costPrice: String(product.costPrice ?? ''),
        category: product.category?.id ? String(product.category.id) : '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        preparationTime: product.preparationTime ? String(product.preparationTime) : '',
        trackInventory: product.trackInventory ?? false,
        stockQuantity: String(product.stockQuantity ?? 0),
        lowStockThreshold: String(product.lowStockThreshold ?? 5),
      });
      setImageId(product.image?.id ?? null);
      setImagePreview(product.image?.url ?? null);
    } else {
      setForm(INITIAL_STATE);
      setImageId(null);
      setImagePreview(null);
    }
    setErrors({});
    setSubmitError(null);
  }, [product, isOpen]);

  const handleChange = useCallback(
    (field: keyof ProductFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        // Clear field error on change
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
    // Reset input so same file can be re-selected
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

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ProductFormState, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Назва обов\'язкова';
    }
    if (!form.price || Number(form.price) < 0) {
      newErrors.price = 'Вкажіть коректну ціну';
    }
    if (form.costPrice && Number(form.costPrice) < 0) {
      newErrors.costPrice = 'Собівартість не може бути від\'ємною';
    }
    if (form.preparationTime && Number(form.preparationTime) < 0) {
      newErrors.preparationTime = 'Час приготування не може бути від\'ємним';
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

      const data: ProductInput = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        image: imageId ?? undefined,
        category: form.category ? Number(form.category) : undefined,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        preparationTime: form.preparationTime ? Number(form.preparationTime) : undefined,
        trackInventory: form.trackInventory,
        stockQuantity: form.trackInventory ? Number(form.stockQuantity) : undefined,
        lowStockThreshold: form.trackInventory ? Number(form.lowStockThreshold) : undefined,
      };

      try {
        if (isEditMode && product) {
          await productsApi.update(product.documentId, data);
        } else {
          await productsApi.create(data);
        }
        onSuccess();
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Помилка збереження продукту'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, product, validate, onSuccess, onClose]
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
      title={isEditMode ? 'Редагувати продукт' : 'Новий продукт'}
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
          placeholder="Введіть назву продукту"
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
            placeholder="Опис продукту"
            rows={3}
          />
        </div>

        {/* Price row */}
        <div className={styles.row}>
          <Input
            label="Ціна (грн) *"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange('price')}
            placeholder="0.00"
            error={!!errors.price}
            errorMessage={errors.price}
            fullWidth
          />
          <Input
            label="Собівартість (грн)"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={handleChange('costPrice')}
            placeholder="0.00"
            error={!!errors.costPrice}
            errorMessage={errors.costPrice}
            fullWidth
          />
        </div>

        {/* Category */}
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

        {/* SKU + Barcode */}
        <div className={styles.row}>
          <Input
            label="Артикул (SKU)"
            value={form.sku}
            onChange={handleChange('sku')}
            placeholder="SKU-001"
            fullWidth
          />
          <Input
            label="Штрих-код"
            value={form.barcode}
            onChange={handleChange('barcode')}
            placeholder="4820000000000"
            fullWidth
          />
        </div>

        {/* Preparation time */}
        <Input
          label="Час приготування (хв)"
          type="number"
          min="0"
          value={form.preparationTime}
          onChange={handleChange('preparationTime')}
          placeholder="5"
          error={!!errors.preparationTime}
          errorMessage={errors.preparationTime}
          fullWidth
        />

        {/* Track Inventory */}
        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={form.trackInventory}
              onChange={handleChange('trackInventory')}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>Відстежувати залишок</span>
          </label>
        </div>

        {/* Stock fields — shown only when trackInventory is true */}
        {form.trackInventory && (
          <div className={styles.row}>
            <Input
              label="Залишок (шт)"
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={handleChange('stockQuantity')}
              placeholder="0"
              fullWidth
            />
            <Input
              label="Мін. залишок (шт)"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={handleChange('lowStockThreshold')}
              placeholder="5"
              fullWidth
            />
          </div>
        )}

        {/* Toggles */}
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
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={handleChange('isFeatured')}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>Рекомендований</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
