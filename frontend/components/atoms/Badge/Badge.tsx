'use client';

/**
 * CoffeePOS Design System - Badge Component
 *
 * Status indicator, count display, or label
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Badge.module.css';

// ============================================
// TYPES
// ============================================

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Show as dot only (no content) */
  dot?: boolean;
  /** Pill shape */
  pill?: boolean;
  /** Outline style instead of filled */
  outline?: boolean;
  /** Children content */
  children?: ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      pill = false,
      outline = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.badge,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      dot && styles.dot,
      pill && styles.pill,
      outline && styles.outline,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classNames} {...props}>
        {!dot && children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
