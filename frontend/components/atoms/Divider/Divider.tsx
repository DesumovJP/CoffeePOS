'use client';

/**
 * ParadisePOS Design System - Divider Component
 *
 * Visual separator between content sections
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Divider.module.css';

// ============================================
// TYPES
// ============================================

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';
export type DividerSpacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Direction of the divider */
  orientation?: DividerOrientation;
  /** Line style */
  variant?: DividerVariant;
  /** Spacing around the divider */
  spacing?: DividerSpacing;
  /** Label text in the center */
  label?: ReactNode;
  /** Label position */
  labelPosition?: 'start' | 'center' | 'end';
}

// ============================================
// COMPONENT
// ============================================

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      spacing = 'md',
      label,
      labelPosition = 'center',
      className,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.divider,
      styles[`orientation-${orientation}`],
      styles[`variant-${variant}`],
      styles[`spacing-${spacing}`],
      label && styles.withLabel,
      label && styles[`label-${labelPosition}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (label && orientation === 'horizontal') {
      return (
        <div ref={ref} className={classNames} role="separator" {...props}>
          <span className={styles.line} />
          <span className={styles.label}>{label}</span>
          <span className={styles.line} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={classNames}
        role="separator"
        aria-orientation={orientation}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
