'use client';

/**
 * CoffeePOS - ProductGrid Component
 *
 * Displays products in a responsive grid with category filtering
 */

import { forwardRef, useMemo, useState, useCallback, useRef, type HTMLAttributes } from 'react';
import { Text, GlassCard, Icon } from '@/components/atoms';
import { ProductCard, SearchInput, CategoryTabs, VariantPicker, type Product, type ProductVariant, type Category } from '@/components/molecules';
import styles from './ProductGrid.module.css';

// ============================================
// TYPES
// ============================================

export interface ProductAddEvent {
  product: Product;
  size?: ProductVariant;
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
  /** Extra content rendered in the header row (after search) */
  headerExtra?: React.ReactNode;
  /** Mobile search mode (replaces header with search input) */
  mobileSearchOpen?: boolean;
  /** Callback to close mobile search */
  onMobileSearchClose?: () => void;
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
      headerExtra,
      mobileSearchOpen = false,
      onMobileSearchClose,
      onProductAdd,
      onCategoryChange,
      onSearchChange,
      className,
      ...props
    },
    ref
  ) => {
    // Variant picker state
    const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);
    const [variantPickerPosition, setVariantPickerPosition] = useState<{ top: number; left: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Handle product click
    const handleProductClick = useCallback((product: Product, element?: HTMLElement) => {
      if (product.variants && product.variants.length > 0) {
        // Show variant picker
        if (element && gridRef.current) {
          const gridRect = gridRef.current.getBoundingClientRect();
          const cardRect = element.getBoundingClientRect();
          setVariantPickerPosition({
            top: cardRect.bottom - gridRect.top + 8,
            left: cardRect.left - gridRect.left,
          });
        }
        setVariantPickerProduct(product);
      } else {
        // No variants, add directly
        onProductAdd?.({ product });
      }
    }, [onProductAdd]);

    // Handle variant selection
    const handleVariantSelect = useCallback((variant: ProductVariant) => {
      if (variantPickerProduct) {
        onProductAdd?.({ product: variantPickerProduct, size: variant });
      }
      setVariantPickerProduct(null);
      setVariantPickerPosition(null);
    }, [variantPickerProduct, onProductAdd]);

    // Close variant picker
    const closeVariantPicker = useCallback(() => {
      setVariantPickerProduct(null);
      setVariantPickerPosition(null);
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

            {/* Inline search — appears between categories and shortcuts */}
            {mobileSearchOpen && (
              <div className={styles.inlineSearch}>
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Пошук..."
                  variant="glass"
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.inlineSearchClose}
                  onClick={() => {
                    onSearchChange?.('');
                    onMobileSearchClose?.();
                  }}
                  aria-label="Закрити пошук"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
            )}

            {headerExtra}
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

              {/* Variant Picker */}
              {variantPickerProduct && variantPickerPosition && (
                <>
                  <div
                    className={styles.sizePickerBackdrop}
                    onClick={closeVariantPicker}
                  />
                  <div
                    className={styles.sizePickerPositioner}
                    style={{
                      top: variantPickerPosition.top,
                      left: variantPickerPosition.left,
                    }}
                  >
                    <VariantPicker
                      productName={variantPickerProduct.name}
                      variants={variantPickerProduct.variants || []}
                      currency={currency}
                      onSelect={handleVariantSelect}
                      onClose={closeVariantPicker}
                    />
                  </div>
                </>
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
