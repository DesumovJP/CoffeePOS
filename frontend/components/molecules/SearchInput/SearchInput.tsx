'use client';

/**
 * CoffeePOS - SearchInput Component
 *
 * Search field with icon and clear button
 */

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Icon, Button } from '@/components/atoms';
import styles from './SearchInput.module.css';

// ============================================
// TYPES
// ============================================

export type SearchInputSize = 'sm' | 'md' | 'lg';
export type SearchInputVariant = 'default' | 'filled' | 'glass';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /** Size variant */
  size?: SearchInputSize;
  /** Style variant */
  variant?: SearchInputVariant;
  /** Current value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when search is submitted */
  onSearch?: (value: string) => void;
  /** Show loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      value: controlledValue,
      onChange,
      onSearch,
      loading = false,
      fullWidth = false,
      disabled,
      placeholder = 'Пошук...',
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState('');
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const hasValue = value.length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      onChange?.('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(value);
      }
      if (e.key === 'Escape') {
        handleClear();
      }
    };

    const classNames = [
      styles.container,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={classNames}>
        <Icon
          name="search"
          size={size === 'lg' ? 'md' : 'sm'}
          color="tertiary"
          className={styles.icon}
        />

        <input
          ref={ref}
          type="search"
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
          {...props}
        />

        {loading && (
          <div className={styles.loader}>
            <Icon name="refresh" size="sm" className={styles.spinning} />
          </div>
        )}

        {hasValue && !loading && (
          <Button
            variant="ghost"
            size="xs"
            iconOnly
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Очистити пошук"
          >
            <Icon name="close" size="xs" />
          </Button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
