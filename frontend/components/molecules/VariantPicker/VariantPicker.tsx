'use client';

/**
 * ParadisePOS - VariantPicker Component
 *
 * Simple variant selection popup for products
 */

import { forwardRef, useEffect, useRef, type HTMLAttributes } from 'react';
import { Text, Icon } from '@/components/atoms';
import type { ProductVariant } from '@/components/molecules/ProductCard';
import styles from './VariantPicker.module.css';

// ============================================
// TYPES
// ============================================

export interface VariantPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Product name */
  productName: string;
  /** Available variants */
  variants: ProductVariant[];
  /** Currency symbol */
  currency?: string;
  /** Callback when variant is selected */
  onSelect: (variant: ProductVariant) => void;
  /** Callback to close picker */
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const VariantPicker = forwardRef<HTMLDivElement, VariantPickerProps>(
  (
    {
      productName,
      variants,
      currency = '₴',
      onSelect,
      onClose,
      className,
      ...props
    },
    ref
  ) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [onClose]);

    const classNames = [styles.picker, className].filter(Boolean).join(' ');

    return (
      <div ref={pickerRef} className={classNames} {...props}>
        {/* Header */}
        <div className={styles.header}>
          <Text variant="labelMedium" weight="semibold">
            {productName}
          </Text>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрити"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Variant options */}
        <div className={styles.variants}>
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className={`${styles.variantBtn} ${variant.isDefault ? styles.default : ''}`}
              onClick={() => onSelect(variant)}
            >
              <span className={styles.variantName}>{variant.name}</span>
              <span className={styles.variantPrice}>
                {currency}{variant.price.toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

VariantPicker.displayName = 'VariantPicker';
