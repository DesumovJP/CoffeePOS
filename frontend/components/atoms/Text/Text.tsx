'use client';

/**
 * CoffeePOS Design System - Text Component
 *
 * Typography component with semantic variants
 * All styles from design tokens - no inline styles
 */

import { type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Text.module.css';

// ============================================
// TYPES
// ============================================

export type TextVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall'
  | 'caption'
  | 'overline';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'inherit';

export type TextAlign = 'left' | 'center' | 'right';

export type TextWeight =
  | 'thin'
  | 'extralight'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Typography variant */
  variant?: TextVariant;
  /** Text color */
  color?: TextColor;
  /** Text alignment */
  align?: TextAlign;
  /** Font weight override */
  weight?: TextWeight;
  /** Truncate with ellipsis */
  truncate?: boolean;
  /** Line clamp (multiline truncation) */
  lineClamp?: number;
  /** Render as different element */
  as?: ElementType;
  /** Children */
  children?: ReactNode;
}

// ============================================
// DEFAULT ELEMENT MAPPING
// ============================================

const variantElementMap: Record<TextVariant, ElementType> = {
  displayLarge: 'h1',
  displayMedium: 'h1',
  displaySmall: 'h2',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  bodyLarge: 'p',
  bodyMedium: 'p',
  bodySmall: 'p',
  labelLarge: 'span',
  labelMedium: 'span',
  labelSmall: 'span',
  caption: 'span',
  overline: 'span',
};

// ============================================
// COMPONENT
// ============================================

export function Text({
  variant = 'bodyMedium',
  color = 'primary',
  align,
  weight,
  truncate = false,
  lineClamp,
  as,
  className,
  style,
  children,
  ...props
}: TextProps) {
  const Component = as || variantElementMap[variant];

  const classNames = [
    styles.text,
    styles[`variant-${variant}`],
    styles[`color-${color}`],
    align && styles[`align-${align}`],
    weight && styles[`weight-${weight}`],
    truncate && styles.truncate,
    lineClamp && styles.lineClamp,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyle = lineClamp
    ? { ...style, '--line-clamp': lineClamp } as React.CSSProperties
    : style;

  return (
    <Component className={classNames} style={inlineStyle} {...props}>
      {children}
    </Component>
  );
}

Text.displayName = 'Text';
