'use client';

/**
 * ParadisePOS - CategoryTabs Component
 *
 * Horizontal scrollable category tabs
 * Used for product category navigation
 */

import { forwardRef, useRef, useState, useEffect, type HTMLAttributes } from 'react';
import { Text, Icon, Button } from '@/components/atoms';
import styles from './CategoryTabs.module.css';

// ============================================
// TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

export interface CategoryTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** List of categories */
  categories: Category[];
  /** Currently selected category ID (null = all) */
  value?: string | null;
  /** Show "All" tab at the start */
  showAll?: boolean;
  /** All tab label */
  allLabel?: string;
  /** Callback when category changes */
  onChange?: (categoryId: string | null) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// COMPONENT
// ============================================

export const CategoryTabs = forwardRef<HTMLDivElement, CategoryTabsProps>(
  (
    {
      categories,
      value,
      showAll = true,
      allLabel = 'Все',
      onChange,
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Check scroll position
    const checkScroll = () => {
      const el = scrollRef.current;
      if (!el) return;

      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    useEffect(() => {
      checkScroll();
      const el = scrollRef.current;
      if (el) {
        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
          el.removeEventListener('scroll', checkScroll);
          window.removeEventListener('resize', checkScroll);
        };
      }
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
      const el = scrollRef.current;
      if (!el) return;

      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    };

    const handleSelect = (categoryId: string | null) => {
      onChange?.(categoryId);
    };

    const classNames = [
      styles.container,
      styles[`size-${size}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Left scroll arrow */}
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => scroll('left')}
            aria-label="Прокрутити вліво"
          >
            <Icon name="chevron-left" size="sm" />
          </Button>
        )}

        {/* Tabs container */}
        <div ref={scrollRef} className={styles.scroll}>
          <div className={styles.tabs}>
            {/* All tab */}
            {showAll && (
              <button
                type="button"
                className={`${styles.tab} ${value === null || value === undefined ? styles.active : ''}`}
                onClick={() => handleSelect(null)}
                aria-pressed={value === null || value === undefined}
              >
                {allLabel}
              </button>
            )}

            {/* Category tabs */}
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.tab} ${value === category.id ? styles.active : ''}`}
                onClick={() => handleSelect(category.id)}
                aria-pressed={value === category.id}
              >
                {category.name}
                {category.count !== undefined && (
                  <span className={styles.count}>{category.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right scroll arrow */}
        {showRightArrow && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => scroll('right')}
            aria-label="Прокрутити вправо"
          >
            <Icon name="chevron-right" size="sm" />
          </Button>
        )}
      </div>
    );
  }
);

CategoryTabs.displayName = 'CategoryTabs';
