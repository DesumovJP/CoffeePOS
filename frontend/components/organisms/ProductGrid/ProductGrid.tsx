'use client';

/**
 * ParadisePOS - ProductGrid Component
 *
 * Displays products in a responsive grid with category filtering
 */

import { forwardRef, useMemo, useState, useCallback, useRef, type HTMLAttributes } from 'react';
import { Text, GlassCard, Icon } from '@/components/atoms';
import { ProductCard, SearchInput, CategoryTabs, SizePicker, type Product, type ProductSize, type Category } from '@/components/molecules';
import styles from './ProductGrid.module.css';

// ============================================
// TYPES
// ============================================

export interface ProductAddEvent {
  product: Product;
  size?: ProductSize;
}

export interface ProductGridProps extends HTMLAttributes<HTMLDivElement> {
  /** List of products */
  products: Product[];
  /** List of categories */
  categories?: Category[];
  /** Selected category ID */
  selectedCategory?: string | null;
  /** Search query */
  searchQuery?: string;
  /** Currency symbol */
  currency?: string;
  /** Loading state */
  loading?: boolean;
  /** Compact product cards */
  compact?: boolean;
  /** Show stock quantities */
  showStock?: boolean;
  /** Callback when product is added (with optional size) */
  onProductAdd?: (event: ProductAddEvent) => void;
  /** Callback when category changes */
  onCategoryChange?: (categoryId: string | null) => void;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export const ProductGrid = forwardRef<HTMLDivElement, ProductGridProps>(
  (
    {
      products,
      categories = [],
      selectedCategory,
      searchQuery = '',
      currency = '₴',
      loading = false,
      compact = false,
      showStock = false,
      onProductAdd,
      onCategoryChange,
      onSearchChange,
      className,
      ...props
    },
    ref
  ) => {
    // Size picker state
    const [sizePickerProduct, setSizePickerProduct] = useState<Product | null>(null);
    const [sizePickerPosition, setSizePickerPosition] = useState<{ top: number; left: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Handle product click
    const handleProductClick = useCallback((product: Product, element?: HTMLElement) => {
      if (product.sizes && product.sizes.length > 0) {
        // Show size picker
        if (element && gridRef.current) {
          const gridRect = gridRef.current.getBoundingClientRect();
          const cardRect = element.getBoundingClientRect();
          setSizePickerPosition({
            top: cardRect.bottom - gridRect.top + 8,
            left: cardRect.left - gridRect.left,
          });
        }
        setSizePickerProduct(product);
      } else {
        // No sizes, add directly
        onProductAdd?.({ product });
      }
    }, [onProductAdd]);

    // Handle size selection
    const handleSizeSelect = useCallback((size: ProductSize) => {
      if (sizePickerProduct) {
        onProductAdd?.({ product: sizePickerProduct, size });
      }
      setSizePickerProduct(null);
      setSizePickerPosition(null);
    }, [sizePickerProduct, onProductAdd]);

    // Close size picker
    const closeSizePicker = useCallback(() => {
      setSizePickerProduct(null);
      setSizePickerPosition(null);
    }, []);

    // Filter products
    const filteredProducts = useMemo(() => {
      let result = products;

      // Filter by category
      if (selectedCategory) {
        result = result.filter((p) => p.category === selectedCategory);
      }

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter((p) =>
          p.name.toLowerCase().includes(query)
        );
      }

      return result;
    }, [products, selectedCategory, searchQuery]);

    // Count products per category
    const categoriesWithCount = useMemo(() => {
      return categories.map((cat) => ({
        ...cat,
        count: products.filter((p) => p.category === cat.id).length,
      }));
    }, [categories, products]);

    const classNames = [styles.container, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Header with categories and search */}
        <div className={styles.header}>
          <div className={styles.headerRow}>
            {/* Categories */}
            <div className={styles.categoriesWrapper}>
              {categories.length > 0 && (
                <CategoryTabs
                  categories={categoriesWithCount}
                  value={selectedCategory}
                  onChange={onCategoryChange}
                  showAll
                  allLabel="Всі"
                />
              )}
            </div>

            {/* Search */}
            <div className={styles.searchWrapper}>
              <SearchInput
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Пошук товарів..."
                variant="glass"
                fullWidth
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className={styles.gridWrapper}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div ref={gridRef} className={`${styles.grid} ${compact ? styles.compact : ''}`}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  compact={compact}
                  showStock={showStock}
                  onAdd={(p) => {
                    const cardElement = document.querySelector(`[data-product-id="${p.id}"]`) as HTMLElement;
                    handleProductClick(p, cardElement || undefined);
                  }}
                  data-product-id={product.id}
                />
              ))}

              {/* Size Picker */}
              {sizePickerProduct && sizePickerPosition && (
                <div
                  style={{
                    position: 'absolute',
                    top: sizePickerPosition.top,
                    left: sizePickerPosition.left,
                  }}
                >
                  <SizePicker
                    productName={sizePickerProduct.name}
                    sizes={sizePickerProduct.sizes || []}
                    currency={currency}
                    onSelect={handleSizeSelect}
                    onClose={closeSizePicker}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className={styles.empty}>
              <Icon name="search" size="2xl" color="tertiary" />
              <Text variant="bodyLarge" color="secondary">
                {searchQuery
                  ? 'Товари не знайдено'
                  : 'Немає товарів у цій категорії'}
              </Text>
              {searchQuery && (
                <Text variant="bodySmall" color="tertiary">
                  Спробуйте змінити пошуковий запит
                </Text>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProductGrid.displayName = 'ProductGrid';
