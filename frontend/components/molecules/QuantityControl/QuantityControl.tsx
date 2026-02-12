'use client';

/**
 * ParadisePOS - QuantityControl Component
 *
 * +/- buttons for quantity adjustment
 * Used in cart and order items
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { Button, Text, Icon } from '@/components/atoms';
import styles from './QuantityControl.module.css';

// ============================================
// TYPES
// ============================================

export type QuantityControlSize = 'sm' | 'md' | 'lg';

export interface QuantityControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current quantity value */
  value: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Size variant */
  size?: QuantityControlSize;
  /** Disable the control */
  disabled?: boolean;
  /** Show delete button when value equals min */
  allowDelete?: boolean;
  /** Callback when value changes */
  onChange?: (value: number) => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const QuantityControl = forwardRef<HTMLDivElement, QuantityControlProps>(
  (
    {
      value,
      min = 0,
      max = 999,
      step = 1,
      size = 'md',
      disabled = false,
      allowDelete = false,
      onChange,
      onDelete,
      className,
      ...props
    },
    ref
  ) => {
    const canDecrement = value > min;
    const canIncrement = value < max;
    const showDelete = allowDelete && value === min + step;

    const handleDecrement = () => {
      if (showDelete && onDelete) {
        onDelete();
      } else if (canDecrement && onChange) {
        onChange(Math.max(min, value - step));
      }
    };

    const handleIncrement = () => {
      if (canIncrement && onChange) {
        onChange(Math.min(max, value + step));
      }
    };

    const classNames = [
      styles.control,
      styles[`size-${size}`],
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const buttonSize = size === 'lg' ? 'md' : size === 'md' ? 'sm' : 'xs';

    return (
      <div ref={ref} className={classNames} {...props}>
        <Button
          variant={showDelete ? 'danger' : 'secondary'}
          size={buttonSize}
          iconOnly
          onClick={handleDecrement}
          disabled={disabled || (!showDelete && !canDecrement)}
          aria-label={showDelete ? 'Видалити' : 'Зменшити кількість'}
        >
          <Icon name={showDelete ? 'delete' : 'minus'} size={size === 'sm' ? 'xs' : 'sm'} />
        </Button>

        <Text
          variant={size === 'lg' ? 'h4' : size === 'md' ? 'labelLarge' : 'labelMedium'}
          weight="semibold"
          className={styles.value}
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </Text>

        <Button
          variant="secondary"
          size={buttonSize}
          iconOnly
          onClick={handleIncrement}
          disabled={disabled || !canIncrement}
          aria-label="Збільшити кількість"
        >
          <Icon name="plus" size={size === 'sm' ? 'xs' : 'sm'} />
        </Button>
      </div>
    );
  }
);

QuantityControl.displayName = 'QuantityControl';
