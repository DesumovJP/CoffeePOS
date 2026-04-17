'use client';

/**
 * CoffeePOS - ProductCard Component
 *
 * Displays a product in the POS grid.
 * Colorful placeholder when no image, clean layout, tap = add.
 */

import { forwardRef, memo, type HTMLAttributes } from 'react';
import { Text, Badge, Icon } from '@/components/atoms';
import styles from './ProductCard.module.css';

// ============================================
// TYPES
// ============================================

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  documentId?: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  variants?: ProductVariant[];
  hasModifiers?: boolean;
  inStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface ProductCardProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Product data */
  product: Product;
  /** Currency symbol */
  currency?: string;
  /** Callback when product is clicked */
  onAdd?: (product: Product) => void;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show stock quantity */
  showStock?: boolean;
  /** Selected state */
  selected?: boolean;
}

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number, currency: string): string {
  return `${currency}${Math.floor(price)}`;
}

// ============================================
// COMPONENT
// ============================================

export const ProductCard = memo(forwardRef<HTMLButtonElement, ProductCardProps>(
  (
    {
      product,
      currency = '₴',
      onAdd,
      compact = false,
      showStock = false,
      selected = false,
      className,
      ...props
    },
    ref
  ) => {
    const isOutOfStock = product.inStock === false || product.stockQuantity === 0;
    const isLowStock =
      product.stockQuantity !== undefined &&
      product.lowStockThreshold !== undefined &&
      product.stockQuantity <= product.lowStockThreshold &&
      product.stockQuantity > 0;

    const handleClick = () => {
      if (!isOutOfStock && onAdd) {
        onAdd(product);
      }
    };

    const classNames = [
      styles.card,
      compact && styles.compact,
      isOutOfStock && styles.outOfStock,
      selected && styles.selected,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const hasImage = !!product.image;

    return (
      <button
        ref={ref}
        type="button"
        className={classNames}
        onClick={handleClick}
        disabled={isOutOfStock}
        aria-label={`${product.name}, ${formatPrice(product.price, currency)}${isOutOfStock ? ', немає в наявності' : ''}`}
        {...props}
      >
        {/* Image or light placeholder */}
        <div className={styles.imageContainer}>
          {hasImage ? (
            <img
              src={product.image}
              alt={product.name}
              className={styles.image}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholder}>
              <span className={styles.initial}>{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {/* Badges */}
          {(isOutOfStock || isLowStock) && (
            <div className={styles.badges}>
              {isOutOfStock && <Badge variant="error" size="sm">Немає</Badge>}
              {isLowStock && !isOutOfStock && <Badge variant="warning" size="sm">Мало</Badge>}
            </div>
          )}
        </div>

        {/* Content — name + price only */}
        <div className={styles.content}>
          <span className={styles.name}>{product.name}</span>
          <span className={styles.price}>
            {formatPrice(product.price, currency)}
            {product.variants && product.variants.length > 1 && (
              <span className={styles.hint}> · {product.variants.length} вар.</span>
            )}
          </span>
        </div>
      </button>
    );
  }
));

ProductCard.displayName = 'ProductCard';
