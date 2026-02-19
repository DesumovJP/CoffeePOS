'use client';

/**
 * CoffeePOS - ProductCard Component
 *
 * Displays a product in the POS grid
 * Supports quick add, out of stock state, and modifiers indicator
 */

import { forwardRef, memo, type HTMLAttributes } from 'react';
import { Text, Badge, Icon, GlassCard } from '@/components/atoms';
import styles from './ProductCard.module.css';

// ============================================
// TYPES
// ============================================

export interface ProductSize {
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
  sizes?: ProductSize[];
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
  return `${currency}${price.toFixed(2)}`;
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
        {/* Image */}
        <div className={styles.imageContainer}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className={styles.image}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholder}>
              <Icon name="package" size="xl" color="tertiary" />
            </div>
          )}

          {/* Badges */}
          <div className={styles.badges}>
            {isOutOfStock && (
              <Badge variant="error" size="sm">
                Немає
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning" size="sm">
                Мало
              </Badge>
            )}
            {product.hasModifiers && !isOutOfStock && (
              <Badge variant="primary" size="sm" pill>
                <Icon name="settings" size="xs" />
              </Badge>
            )}
          </div>

          {/* Quick add indicator - inside image */}
          {!isOutOfStock && (
            <div className={styles.addIndicator}>
              <Icon name="plus" size="sm" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <Text
            variant="bodyMedium"
            color="primary"
            className={styles.name}
            lineClamp={2}
          >
            {product.name}
          </Text>

          <div className={styles.footer}>
            <Text
              variant="labelMedium"
              color="primary"
              weight="semibold"
            >
              {formatPrice(product.price, currency)}
            </Text>

            {product.sizes && product.sizes.length > 1 ? (
              <Text variant="caption" color="tertiary" className={styles.sizesHint}>
                {`${product.sizes.length} розм.`}
              </Text>
            ) : showStock && product.stockQuantity !== undefined && !isOutOfStock ? (
              <Text variant="caption" color="tertiary">
                {product.stockQuantity} шт
              </Text>
            ) : null}
          </div>
        </div>
      </button>
    );
  }
));

ProductCard.displayName = 'ProductCard';
