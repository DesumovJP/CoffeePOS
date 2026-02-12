/**
 * ParadisePOS Design System - Design Tokens
 *
 * Central export for all design tokens
 * Import from here to ensure consistency across the application
 *
 * Usage:
 * import { tokens } from '@/design-system/tokens';
 * import { colors, spacing } from '@/design-system/tokens';
 */

export { colors } from './colors';
export type { ColorToken, NeutralShade, AccentShade } from './colors';

export { typography } from './typography';
export type { TypographyToken, FontSize, FontWeight, TypographyVariant } from './typography';

export { spacing, sizing } from './spacing';
export type { SpacingToken, SizingToken, SpacingScale } from './spacing';

export { radius } from './radius';
export type { RadiusToken, RadiusScale } from './radius';

export { elevation } from './elevation';
export type { ElevationToken, ShadowScale, BlurScale, ZIndexScale } from './elevation';

export { motion } from './motion';
export type { MotionToken, DurationScale, EasingScale, AnimationScale } from './motion';

export { breakpoints, mediaUp, mediaDown, mediaBetween } from './breakpoints';
export type { BreakpointToken, BreakpointScale } from './breakpoints';

// ============================================
// COMBINED TOKENS OBJECT
// ============================================
import { colors } from './colors';
import { typography } from './typography';
import { spacing, sizing } from './spacing';
import { radius } from './radius';
import { elevation } from './elevation';
import { motion } from './motion';
import { breakpoints } from './breakpoints';

export const tokens = {
  colors,
  typography,
  spacing,
  sizing,
  radius,
  elevation,
  motion,
  breakpoints,
} as const;

export type Tokens = typeof tokens;

// ============================================
// CSS VARIABLES GENERATOR
// ============================================

/**
 * Generates CSS custom properties from tokens
 * Used by ThemeProvider to inject variables into :root
 */
export function generateCSSVariables(theme: 'light' | 'dark' = 'light'): Record<string, string> {
  const isDark = theme === 'dark';

  return {
    // Colors - Glass
    '--glass-bg': isDark ? colors.glass.dark.bg : colors.glass.light.bg,
    '--glass-bg-subtle': isDark ? colors.glass.dark.bgSubtle : colors.glass.light.bgSubtle,
    '--glass-bg-elevated': isDark ? colors.glass.dark.bgElevated : colors.glass.light.bgElevated,
    '--glass-border': isDark ? colors.glass.dark.border : colors.glass.light.border,
    '--glass-border-strong': isDark ? colors.glass.dark.borderStrong : colors.glass.light.borderStrong,

    // Colors - Neutral
    '--color-neutral-0': colors.neutral[0],
    '--color-neutral-50': colors.neutral[50],
    '--color-neutral-100': colors.neutral[100],
    '--color-neutral-200': colors.neutral[200],
    '--color-neutral-300': colors.neutral[300],
    '--color-neutral-400': colors.neutral[400],
    '--color-neutral-500': colors.neutral[500],
    '--color-neutral-600': colors.neutral[600],
    '--color-neutral-700': colors.neutral[700],
    '--color-neutral-800': colors.neutral[800],
    '--color-neutral-900': colors.neutral[900],
    '--color-neutral-950': colors.neutral[950],

    // Colors - Accent
    '--color-accent-50': colors.accent[50],
    '--color-accent-100': colors.accent[100],
    '--color-accent-200': colors.accent[200],
    '--color-accent-300': colors.accent[300],
    '--color-accent-400': colors.accent[400],
    '--color-accent-500': colors.accent[500],
    '--color-accent-600': colors.accent[600],
    '--color-accent-700': colors.accent[700],
    '--color-accent-800': colors.accent[800],
    '--color-accent-900': colors.accent[900],

    // Colors - Semantic
    '--color-success': colors.semantic.success.DEFAULT,
    '--color-success-light': colors.semantic.success.light,
    '--color-success-dark': colors.semantic.success.dark,
    '--color-success-bg': colors.semantic.success.bg,
    '--color-warning': colors.semantic.warning.DEFAULT,
    '--color-warning-light': colors.semantic.warning.light,
    '--color-warning-dark': colors.semantic.warning.dark,
    '--color-warning-bg': colors.semantic.warning.bg,
    '--color-error': colors.semantic.error.DEFAULT,
    '--color-error-light': colors.semantic.error.light,
    '--color-error-dark': colors.semantic.error.dark,
    '--color-error-bg': colors.semantic.error.bg,
    '--color-info': colors.semantic.info.DEFAULT,
    '--color-info-light': colors.semantic.info.light,
    '--color-info-dark': colors.semantic.info.dark,
    '--color-info-bg': colors.semantic.info.bg,

    // Colors - Background
    '--bg-primary': isDark ? colors.background.dark.primary : colors.background.primary,
    '--bg-secondary': isDark ? colors.background.dark.secondary : colors.background.secondary,
    '--bg-tertiary': isDark ? colors.background.dark.tertiary : colors.background.tertiary,
    '--bg-inverse': isDark ? colors.background.dark.inverse : colors.background.inverse,

    // Colors - Text
    '--text-primary': isDark ? colors.text.dark.primary : colors.text.primary,
    '--text-secondary': isDark ? colors.text.dark.secondary : colors.text.secondary,
    '--text-tertiary': isDark ? colors.text.dark.tertiary : colors.text.tertiary,
    '--text-disabled': isDark ? colors.text.dark.disabled : colors.text.disabled,
    '--text-inverse': isDark ? colors.text.dark.inverse : colors.text.inverse,

    // Typography
    '--font-sans': typography.fontFamily.sans,
    '--font-mono': typography.fontFamily.mono,
    '--text-xs': typography.fontSize.xs,
    '--text-sm': typography.fontSize.sm,
    '--text-base': typography.fontSize.base,
    '--text-lg': typography.fontSize.lg,
    '--text-xl': typography.fontSize.xl,
    '--text-2xl': typography.fontSize['2xl'],
    '--text-3xl': typography.fontSize['3xl'],
    '--text-4xl': typography.fontSize['4xl'],
    '--text-5xl': typography.fontSize['5xl'],
    '--text-6xl': typography.fontSize['6xl'],

    // Spacing
    '--space-0': spacing[0],
    '--space-1': spacing[1],
    '--space-2': spacing[2],
    '--space-3': spacing[3],
    '--space-4': spacing[4],
    '--space-5': spacing[5],
    '--space-6': spacing[6],
    '--space-8': spacing[8],
    '--space-10': spacing[10],
    '--space-12': spacing[12],
    '--space-16': spacing[16],
    '--space-20': spacing[20],
    '--space-24': spacing[24],

    // Radius
    '--radius-none': radius.none,
    '--radius-xs': radius.xs,
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    '--radius-2xl': radius['2xl'],
    '--radius-3xl': radius['3xl'],
    '--radius-full': radius.full,

    // Shadows
    '--shadow-xs': elevation.shadow.xs,
    '--shadow-sm': elevation.shadow.sm,
    '--shadow-md': elevation.shadow.md,
    '--shadow-lg': elevation.shadow.lg,
    '--shadow-xl': elevation.shadow.xl,
    '--shadow-2xl': elevation.shadow['2xl'],
    '--shadow-glass': elevation.shadow.glass,
    '--shadow-card': elevation.shadow.card,
    '--shadow-modal': elevation.shadow.modal,
    '--shadow-focus': elevation.shadow.focus,

    // Blur
    '--blur-sm': elevation.blur.sm,
    '--blur-md': elevation.blur.md,
    '--blur-lg': elevation.blur.lg,
    '--blur-xl': elevation.blur.xl,
    '--blur-glass': elevation.blur.glass,

    // Motion
    '--duration-fast': motion.duration.fast,
    '--duration-normal': motion.duration.normal,
    '--duration-slow': motion.duration.slow,
    '--ease-default': motion.easing.default,
    '--ease-spring': motion.easing.spring,
    '--transition-all': motion.transition.all,
    '--transition-colors': motion.transition.colors,
  };
}
