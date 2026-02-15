'use client';

/**
 * CoffeePOS Design System - GlassCard Component
 *
 * iOS 26 Liquid Glass style card container
 * Key component for the glass morphism design language
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './GlassCard.module.css';

// ============================================
// TYPES
// ============================================

export type GlassIntensity = 'subtle' | 'default' | 'strong';
export type GlassPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Blur intensity */
  intensity?: GlassIntensity;
  /** Inner padding */
  padding?: GlassPadding;
  /** Show border */
  bordered?: boolean;
  /** Add shadow */
  elevated?: boolean;
  /** Interactive hover effect */
  interactive?: boolean;
  /** Border radius size */
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Children */
  children?: ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      intensity = 'default',
      padding = 'md',
      bordered = true,
      elevated = false,
      interactive = false,
      radius = 'xl',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      styles[`intensity-${intensity}`],
      styles[`padding-${padding}`],
      styles[`radius-${radius}`],
      bordered && styles.bordered,
      elevated && styles.elevated,
      interactive && styles.interactive,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
