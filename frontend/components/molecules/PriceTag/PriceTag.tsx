'use client';

/**
 * ParadisePOS - PriceTag Component
 *
 * Currency formatted price display
 * Supports discounts and original price
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { Text } from '@/components/atoms';
import styles from './PriceTag.module.css';

// ============================================
// TYPES
// ============================================

export type PriceTagSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PriceTagProps extends HTMLAttributes<HTMLDivElement> {
  /** Current price */
  price: number;
  /** Original price (for showing discount) */
  originalPrice?: number;
  /** Currency symbol */
  currency?: string;
  /** Size variant */
  size?: PriceTagSize;
  /** Discount percentage to display */
  discountPercent?: number;
  /** Show "Free" instead of 0 price */
  showFree?: boolean;
  /** Align text */
  align?: 'left' | 'center' | 'right';
}

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(2)}`;
}

// ============================================
// COMPONENT
// ============================================

export const PriceTag = forwardRef<HTMLDivElement, PriceTagProps>(
  (
    {
      price,
      originalPrice,
      currency = '₴',
      size = 'md',
      discountPercent,
      showFree = true,
      align = 'left',
      className,
      ...props
    },
    ref
  ) => {
    const hasDiscount = originalPrice !== undefined && originalPrice > price;
    const isFree = price === 0 && showFree;

    const classNames = [
      styles.priceTag,
      styles[`size-${size}`],
      styles[`align-${align}`],
      hasDiscount && styles.hasDiscount,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const priceVariant = {
      sm: 'labelMedium' as const,
      md: 'labelLarge' as const,
      lg: 'h4' as const,
      xl: 'h3' as const,
    };

    const originalVariant = {
      sm: 'caption' as const,
      md: 'labelSmall' as const,
      lg: 'labelMedium' as const,
      xl: 'labelLarge' as const,
    };

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Main price */}
        <Text
          variant={priceVariant[size]}
          weight="semibold"
          color={hasDiscount ? 'error' : 'primary'}
          className={styles.currentPrice}
        >
          {isFree ? 'Безкоштовно' : formatPrice(price, currency)}
        </Text>

        {/* Original price (strikethrough) */}
        {hasDiscount && (
          <Text
            variant={originalVariant[size]}
            color="tertiary"
            className={styles.originalPrice}
          >
            {formatPrice(originalPrice!, currency)}
          </Text>
        )}

        {/* Discount badge */}
        {hasDiscount && discountPercent && (
          <span className={styles.discountBadge}>
            -{discountPercent}%
          </span>
        )}
      </div>
    );
  }
);

PriceTag.displayName = 'PriceTag';
