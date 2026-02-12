'use client';

/**
 * ParadisePOS Design System - Spinner Component
 *
 * Loading indicator with multiple sizes
 */

import type { HTMLAttributes } from 'react';
import styles from './Spinner.module.css';

// ============================================
// TYPES
// ============================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color - defaults to current text color */
  color?: string;
  /** Screen reader label */
  label?: string;
}

// ============================================
// COMPONENT
// ============================================

export function Spinner({
  size = 'md',
  color,
  label = 'Loading',
  className,
  style,
  ...props
}: SpinnerProps) {
  const classNames = [styles.spinner, styles[`size-${size}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="status"
      aria-label={label}
      style={{
        ...style,
        ...(color ? { '--spinner-color': color } as React.CSSProperties : {}),
      }}
      {...props}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
        />
        <circle
          className={styles.circle}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}

Spinner.displayName = 'Spinner';
