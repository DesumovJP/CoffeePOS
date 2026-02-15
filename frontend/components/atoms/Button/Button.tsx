'use client';

/**
 * CoffeePOS Design System - Button Component
 *
 * Primary interactive element for user actions
 * Supports multiple variants, sizes, and states
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from '../Spinner';
import styles from './Button.module.css';

// ============================================
// TYPES
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
  /** Icon to display before children */
  iconLeft?: ReactNode;
  /** Icon to display after children */
  iconRight?: ReactNode;
  /** Icon-only button (square aspect ratio) */
  iconOnly?: boolean;
  /** Pill-shaped button */
  pill?: boolean;
  /** Glass effect (iOS Liquid Glass style) */
  glass?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      iconLeft,
      iconRight,
      iconOnly = false,
      pill = false,
      glass = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classNames = [
      styles.button,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      fullWidth && styles.fullWidth,
      iconOnly && styles.iconOnly,
      pill && styles.pill,
      glass && styles.glass,
      loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinnerWrapper}>
            <Spinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
          </span>
        )}
        <span className={styles.content} data-loading={loading}>
          {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
          {children && <span className={styles.label}>{children}</span>}
          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
