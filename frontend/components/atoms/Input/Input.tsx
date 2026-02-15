'use client';

/**
 * CoffeePOS Design System - Input Component
 *
 * Text input field with various states and variants
 */

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from 'react';
import styles from './Input.module.css';

// ============================================
// TYPES
// ============================================

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'glass';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: InputSize;
  /** Style variant */
  variant?: InputVariant;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message (also sets error state) */
  errorMessage?: string;
  /** Success state */
  success?: boolean;
  /** Icon on the left */
  iconLeft?: ReactNode;
  /** Icon on the right */
  iconRight?: ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      label,
      helperText,
      error = false,
      errorMessage,
      success = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      disabled,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const helperId = `${inputId}-helper`;
    const hasError = error || !!errorMessage;

    const wrapperClassNames = [
      styles.wrapper,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputWrapperClassNames = [
      styles.inputWrapper,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      hasError && styles.error,
      success && !hasError && styles.success,
      disabled && styles.disabled,
      iconLeft && styles.hasIconLeft,
      iconRight && styles.hasIconRight,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        <div className={inputWrapperClassNames}>
          {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}

          <input
            ref={ref}
            id={inputId}
            className={styles.input}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helperText || errorMessage ? helperId : undefined}
            {...props}
          />

          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
        </div>

        {(helperText || errorMessage) && (
          <span
            id={helperId}
            className={`${styles.helper} ${hasError ? styles.helperError : ''}`}
          >
            {errorMessage || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
