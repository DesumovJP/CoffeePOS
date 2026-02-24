'use client';

/**
 * CoffeePOS - IngredientDetailModal
 *
 * Shows stock, financial, and supplier details for a single ingredient.
 * Edit button opens the IngredientFormModal.
 */

import { useMemo } from 'react';
import { Modal, Text, Badge, Button, Icon } from '@/components/atoms';
import type { Ingredient, IngredientUnit } from '@/lib/api';
import styles from './IngredientDetailModal.module.css';

// ============================================
// TYPES
// ============================================

export interface IngredientDetailModalProps {
  ingredient: Ingredient | null;
  onClose: () => void;
  onEdit: (ingredient: Ingredient) => void;
}

// ============================================
// HELPERS
// ============================================

const UNIT_LABELS: Record<IngredientUnit, string> = {
  g: 'г',
  kg: 'кг',
  ml: 'мл',
  l: 'л',
  pcs: 'шт',
  portion: 'порц',
};

function formatQuantity(quantity: number, unit: IngredientUnit): string {
  if (unit === 'g' && quantity >= 1000) return `${(quantity / 1000).toFixed(2)} кг`;
  if (unit === 'ml' && quantity >= 1000) return `${(quantity / 1000).toFixed(2)} л`;
  return `${quantity} ${UNIT_LABELS[unit]}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ============================================
// COMPONENT
// ============================================

export function IngredientDetailModal({ ingredient, onClose, onEdit }: IngredientDetailModalProps) {
  if (!ingredient) return null;

  const isOutOfStock = ingredient.quantity <= 0;
  const isLowStock = !isOutOfStock && ingredient.quantity <= ingredient.minQuantity;

  const stockStatus = isOutOfStock ? 'error' : isLowStock ? 'warning' : 'success';
  const stockLabel = isOutOfStock ? 'Немає' : isLowStock ? 'Мало' : 'В нормі';

  // Progress bar: 0–200% of minQuantity, capped at 100% display
  const stockPct = useMemo(() => {
    const max = (ingredient.minQuantity || 1) * 2;
    return Math.min(100, (ingredient.quantity / max) * 100);
  }, [ingredient]);

  const totalValue = ingredient.quantity * ingredient.costPerUnit;
  const minStockValue = ingredient.minQuantity * ingredient.costPerUnit;

  // Parse comma-separated suppliers
  const suppliers = useMemo(() => {
    if (!ingredient.supplier?.trim()) return [];
    return ingredient.supplier.split(',').map((s) => s.trim()).filter(Boolean);
  }, [ingredient.supplier]);

  const footer = (
    <Button
      variant="primary"
      onClick={() => onEdit(ingredient)}
      fullWidth
    >
      <Icon name="edit" size="sm" />
      Редагувати
    </Button>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={ingredient.name}
      subtitle={ingredient.category?.name}
      icon="package"
      size="sm"
      footer={footer}
    >
      {/* ── Запаси ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text variant="labelSmall" weight="semibold" color="tertiary" className={styles.sectionTitle}>
            ЗАПАСИ
          </Text>
          <Badge variant={stockStatus} size="sm">{stockLabel}</Badge>
        </div>

        <div className={styles.row}>
          <Text variant="bodySmall" color="secondary">Поточний залишок</Text>
          <Text variant="labelMedium" weight="semibold" color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'primary'}>
            {formatQuantity(ingredient.quantity, ingredient.unit)}
          </Text>
        </div>

        <div className={styles.stockBarContainer}>
          <div className={styles.stockBarTrack}>
            <div
              className={`${styles.stockBarFill} ${
                isOutOfStock ? styles.fillCritical : isLowStock ? styles.fillLow : styles.fillGood
              }`}
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <Text variant="caption" color="tertiary" className={styles.stockBarLabel}>
            {stockPct.toFixed(0)}% від норми
          </Text>
        </div>

        <div className={styles.row}>
          <Text variant="bodySmall" color="secondary">Мін. запас</Text>
          <Text variant="bodySmall">{formatQuantity(ingredient.minQuantity, ingredient.unit)}</Text>
        </div>

        <div className={styles.row}>
          <Text variant="bodySmall" color="secondary">Одиниця</Text>
          <Text variant="bodySmall">{UNIT_LABELS[ingredient.unit]}</Text>
        </div>
      </div>

      {/* ── Фінанси ── */}
      <div className={styles.section}>
        <Text variant="labelSmall" weight="semibold" color="tertiary" className={styles.sectionTitle}>
          ФІНАНСИ
        </Text>

        <div className={styles.row}>
          <Text variant="bodySmall" color="secondary">Ціна за одиницю</Text>
          <Text variant="labelMedium" weight="semibold">
            ₴{formatCurrency(ingredient.costPerUnit)} / {UNIT_LABELS[ingredient.unit]}
          </Text>
        </div>

        <div className={styles.row}>
          <Text variant="bodySmall" color="secondary">Вартість залишку</Text>
          <Text variant="labelMedium" weight="semibold" className={styles.valueHighlight}>
            ₴{formatCurrency(totalValue)}
          </Text>
        </div>

        <div className={styles.row}>
          <Text variant="bodySmall" color="secondary">Вартість мін. запасу</Text>
          <Text variant="bodySmall" color="tertiary">₴{formatCurrency(minStockValue)}</Text>
        </div>
      </div>

      {/* ── Постачальники ── */}
      <div className={styles.section}>
        <Text variant="labelSmall" weight="semibold" color="tertiary" className={styles.sectionTitle}>
          ПОСТАЧАЛЬНИКИ
        </Text>

        {suppliers.length > 0 ? (
          <div className={styles.supplierList}>
            {suppliers.map((name, i) => (
              <div key={i} className={styles.supplierChip}>
                <Icon name="truck" size="xs" color="secondary" />
                <Text variant="bodySmall">{name}</Text>
              </div>
            ))}
          </div>
        ) : (
          <Text variant="bodySmall" color="tertiary">Не вказано</Text>
        )}
      </div>
    </Modal>
  );
}
