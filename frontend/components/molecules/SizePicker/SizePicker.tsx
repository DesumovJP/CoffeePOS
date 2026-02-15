'use client';

/**
 * CoffeePOS - SizePicker Component
 *
 * Simple size selection popup for products
 */

import { forwardRef, useEffect, useRef, type HTMLAttributes } from 'react';
import { Text, Icon } from '@/components/atoms';
import styles from './SizePicker.module.css';

// ============================================
// TYPES
// ============================================

export interface ProductSize {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface SizePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Product name */
  productName: string;
  /** Available sizes */
  sizes: ProductSize[];
  /** Currency symbol */
  currency?: string;
  /** Callback when size is selected */
  onSelect: (size: ProductSize) => void;
  /** Callback to close picker */
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const SizePicker = forwardRef<HTMLDivElement, SizePickerProps>(
  (
    {
      productName,
      sizes,
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

        {/* Size options */}
        <div className={styles.sizes}>
          {sizes.map((size) => (
            <button
              key={size.id}
              type="button"
              className={`${styles.sizeBtn} ${size.isDefault ? styles.default : ''}`}
              onClick={() => onSelect(size)}
            >
              <span className={styles.sizeName}>{size.name}</span>
              <span className={styles.sizePrice}>
                {currency}{size.price.toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

SizePicker.displayName = 'SizePicker';
