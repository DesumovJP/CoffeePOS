'use client';

/**
 * FilterTabs - Universal filter tabs component
 *
 * Replaces custom tabs in Products, Inventory, Reports pages
 */

import { useRef, useState, useEffect } from 'react';
import { Icon, type IconName } from '@/components/atoms';
import styles from './FilterTabs.module.css';

export interface FilterTab {
  /** Unique tab identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: IconName;
  /** Optional count badge */
  count?: number;
  /** Tab variant for special styling */
  variant?: 'default' | 'warning' | 'success' | 'error';
}

export interface FilterTabsProps {
  /** Array of tab items */
  tabs: FilterTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Allow horizontal scrolling */
  scrollable?: boolean;
  /** Additional className */
  className?: string;
}

export function FilterTabs({
  tabs,
  activeTab,
  onTabChange,
  size = 'md',
  scrollable = true,
  className,
}: FilterTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current || !scrollable) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`${styles.container} ${styles[size]} ${className || ''}`}>
      {scrollable && showLeftArrow && (
        <button
          className={`${styles.scrollButton} ${styles.left}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <Icon name="chevron-left" size="sm" />
        </button>
      )}

      <div
        ref={scrollRef}
        className={styles.tabs}
        onScroll={checkScroll}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              ${styles.tab}
              ${activeTab === tab.id ? styles.active : ''}
              ${tab.variant ? styles[tab.variant] : ''}
            `}
            onClick={() => onTabChange(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            {tab.icon && <Icon name={tab.icon} size="xs" />}
            <span className={styles.label}>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={styles.count}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {scrollable && showRightArrow && (
        <button
          className={`${styles.scrollButton} ${styles.right}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <Icon name="chevron-right" size="sm" />
        </button>
      )}
    </div>
  );
}

export default FilterTabs;
