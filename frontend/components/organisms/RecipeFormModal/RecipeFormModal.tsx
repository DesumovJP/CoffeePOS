'use client';

/**
 * CoffeePOS - RecipeFormModal Component
 *
 * Create/edit recipes with dynamic ingredient list
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Text, Button, Icon, Input } from '@/components/atoms';
import { Modal } from '@/components/atoms/Modal';
import { recipesApi, uploadFile } from '@/lib/api';
import type { ApiRecipe } from '@/lib/api';
import type { Product, Ingredient } from '@/lib/api/types';
import styles from './RecipeFormModal.module.css';

// ============================================
// TYPES
// ============================================

interface IngredientRow {
  id: string;
  ingredientId: number;
  amount: number;
}

export interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe?: ApiRecipe | null;
  products: Product[];
  ingredients: Ingredient[];
  onSuccess: () => void;
}

// ============================================
// HELPERS
// ============================================

let rowCounter = 0;
function generateRowId(): string {
  rowCounter += 1;
  return `row-${Date.now()}-${rowCounter}`;
}

// ============================================
// COMPONENT
// ============================================

export function RecipeFormModal({
  isOpen,
  onClose,
  recipe,
  products,
  ingredients,
  onSuccess,
}: RecipeFormModalProps) {
  const isEditing = !!recipe;

  // Form state
  const [productId, setProductId] = useState<number>(0);
  const [sizeId, setSizeId] = useState('');
  const [sizeName, setSizeName] = useState('');
  const [sizeVolume, setSizeVolume] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isDefault, setIsDefault] = useState(false);
  const [preparationNotes, setPreparationNotes] = useState('');
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload state
  const [imageId, setImageId] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or recipe changes
  useEffect(() => {
    if (isOpen) {
      if (recipe) {
        setProductId(recipe.product?.id || 0);
        setSizeId(recipe.sizeId || '');
        setSizeName(recipe.sizeName || '');
        setSizeVolume(recipe.sizeVolume || '');
        setPrice(String(recipe.price || ''));
        setIsDefault(recipe.isDefault || false);
        setPreparationNotes(recipe.preparationNotes || '');
        setIngredientRows(
          (recipe.ingredients || []).map((ing) => ({
            id: generateRowId(),
            ingredientId: ing.ingredientId,
            amount: ing.amount,
          }))
        );
        setImageId(recipe.image?.id ?? null);
        setImagePreview(recipe.image?.url ?? null);
      } else {
        setProductId(0);
        setSizeId('');
        setSizeName('');
        setSizeVolume('');
        setPrice('');
        setIsDefault(false);
        setPreparationNotes('');
        setIngredientRows([]);
        setImageId(null);
        setImagePreview(null);
      }
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, recipe]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file.type.startsWith('image/')) {
      setError('Оберіть файл зображення (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 5 МБ');
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    try {
      setIsUploading(true);
      const uploaded = await uploadFile(file);
      setImageId(uploaded.id);
      setImagePreview(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
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

  // Auto-calculate cost price
  const costPrice = useMemo(() => {
    return ingredientRows.reduce((sum, row) => {
      const ingredient = ingredients.find((i) => i.id === row.ingredientId);
      if (!ingredient) return sum;
      return sum + ingredient.costPerUnit * row.amount;
    }, 0);
  }, [ingredientRows, ingredients]);

  // Ingredient row management
  const addIngredientRow = useCallback(() => {
    setIngredientRows((prev) => [
      ...prev,
      { id: generateRowId(), ingredientId: 0, amount: 0 },
    ]);
  }, []);

  const removeIngredientRow = useCallback((rowId: string) => {
    setIngredientRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const updateIngredientRow = useCallback(
    (rowId: string, field: 'ingredientId' | 'amount', value: number) => {
      setIngredientRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  // Submit handler
  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!price || parseFloat(price) <= 0) {
      setError('Вкажіть ціну');
      return;
    }

    if (!sizeId.trim()) {
      setError('Вкажіть ID розміру');
      return;
    }

    if (!sizeName.trim()) {
      setError('Вкажіть назву розміру');
      return;
    }

    const validIngredients = ingredientRows.filter(
      (r) => r.ingredientId > 0 && r.amount > 0
    );

    const payload = {
      product: productId || undefined,
      sizeId: sizeId.trim(),
      sizeName: sizeName.trim(),
      sizeVolume: sizeVolume.trim() || undefined,
      price: parseFloat(price),
      costPrice,
      isDefault,
      preparationNotes: preparationNotes.trim() || undefined,
      ingredients: validIngredients.map((r) => ({
        ingredientId: r.ingredientId,
        amount: r.amount,
      })),
      image: imageId ?? undefined,
    };

    setSubmitting(true);

    try {
      if (isEditing && recipe) {
        await recipesApi.update(recipe.documentId, payload);
      } else {
        await recipesApi.create(payload);
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
      title={isEditing ? 'Редагувати рецепт' : 'Новий рецепт'}
      subtitle="Налаштуйте розмір, ціну та інгредієнти"
      icon="menu"
      size="lg"
      footer={footer}
    >
      <div className={styles.form}>
        {error && (
          <div className={styles.errorBanner}>
            <Icon name="warning" size="sm" color="error" />
            <Text variant="bodySmall" color="error">{error}</Text>
          </div>
        )}

        {/* Product select */}
        <div className={styles.field}>
          <label className={styles.label}>Продукт</label>
          <select
            className={styles.select}
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
          >
            <option value={0}>-- Оберіть продукт --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Image upload */}
        <div className={styles.field}>
          <label className={styles.label}>Зображення</label>
          <div className={styles.imageRow}>
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
                  <Text variant="caption" color="tertiary">Завантажити</Text>
                </div>
              )}
            </button>
            <div className={styles.imageActions}>
              <Text variant="caption" color="tertiary">JPG, PNG, WebP · до 5 МБ</Text>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Icon name="upload" size="sm" />
                {isUploading ? 'Завантаження...' : 'Обрати файл'}
              </button>
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

        {/* Size fields */}
        <div className={styles.row}>
          <Input
            label="ID розміру"
            placeholder="small"
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            fullWidth
          />
          <Input
            label="Назва розміру"
            placeholder="Маленький"
            value={sizeName}
            onChange={(e) => setSizeName(e.target.value)}
            fullWidth
          />
          <Input
            label="Об'єм"
            placeholder="200мл"
            value={sizeVolume}
            onChange={(e) => setSizeVolume(e.target.value)}
            fullWidth
          />
        </div>

        {/* Price and default */}
        <div className={styles.row}>
          <Input
            label="Ціна (₴)"
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            step={0.01}
            fullWidth
          />
          <div className={styles.field}>
            <label className={styles.label}>Собівартість (₴)</label>
            <div className={styles.costDisplay}>
              <Text variant="bodyLarge" weight="semibold" color="accent">
                {costPrice.toFixed(2)}
              </Text>
              <Text variant="caption" color="tertiary">авто</Text>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>За замовчуванням</label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className={styles.checkbox}
              />
              <Text variant="bodyMedium">Основний розмір</Text>
            </label>
          </div>
        </div>

        {/* Ingredients section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text variant="h5" weight="semibold">Інгредієнти</Text>
            <Text variant="caption" color="tertiary">
              {ingredientRows.length} {ingredientRows.length === 1 ? 'інгредієнт' : 'інгредієнтів'}
            </Text>
          </div>

          <div className={styles.ingredientList}>
            {ingredientRows.map((row) => (
              <div key={row.id} className={styles.ingredientRow}>
                <select
                  className={styles.select}
                  value={row.ingredientId}
                  onChange={(e) =>
                    updateIngredientRow(row.id, 'ingredientId', Number(e.target.value))
                  }
                >
                  <option value={0}>-- Інгредієнт --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Кількість"
                  value={row.amount || ''}
                  onChange={(e) =>
                    updateIngredientRow(row.id, 'amount', parseFloat(e.target.value) || 0)
                  }
                  min={0}
                  step={0.01}
                  size="sm"
                />
                {row.ingredientId > 0 && row.amount > 0 && (
                  <Text variant="caption" color="tertiary" className={styles.rowCost}>
                    ₴{(
                      (ingredients.find((i) => i.id === row.ingredientId)?.costPerUnit || 0) *
                      row.amount
                    ).toFixed(2)}
                  </Text>
                )}
                <Button
                  variant="danger"
                  size="xs"
                  iconOnly
                  onClick={() => removeIngredientRow(row.id)}
                  className={styles.removeButton}
                >
                  <Icon name="close" size="xs" />
                </Button>
              </div>
            ))}

            <button
              type="button"
              className={styles.addButton}
              onClick={addIngredientRow}
            >
              <Icon name="plus" size="sm" color="accent" />
              <Text variant="labelMedium" color="accent">Додати інгредієнт</Text>
            </button>
          </div>
        </div>

        {/* Preparation notes */}
        <div className={styles.field}>
          <label className={styles.label}>Примітки до приготування</label>
          <textarea
            className={styles.textarea}
            value={preparationNotes}
            onChange={(e) => setPreparationNotes(e.target.value)}
            placeholder="Особливості приготування..."
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
