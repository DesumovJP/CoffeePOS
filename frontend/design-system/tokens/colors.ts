/**
 * ParadisePOS Design System - Color Tokens
 * iOS 26 Liquid Glass inspired palette
 *
 * Usage: Import and use via CSS variables or directly in styled-components
 * All colors are centralized here - change once, update everywhere
 */

export const colors = {
  // ============================================
  // GLASS SURFACES
  // ============================================
  glass: {
    light: {
      bg: 'rgba(255, 255, 255, 0.72)',
      bgSubtle: 'rgba(255, 255, 255, 0.48)',
      bgElevated: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(255, 255, 255, 0.18)',
      borderStrong: 'rgba(255, 255, 255, 0.32)',
    },
    dark: {
      bg: 'rgba(0, 0, 0, 0.65)',
      bgSubtle: 'rgba(0, 0, 0, 0.45)',
      bgElevated: 'rgba(0, 0, 0, 0.78)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderStrong: 'rgba(255, 255, 255, 0.24)',
    },
  },

  // ============================================
  // NEUTRAL SCALE (Clean minimal)
  // ============================================
  neutral: {
    0: '#FFFFFF',
    50: '#F7F7F7',
    100: '#F0F0F0',
    200: '#E4E4E4',
    300: '#D1D1D1',
    400: '#A0A0A0',
    500: '#6B6B6B',
    600: '#525252',
    700: '#3D3D3D',
    800: '#292929',
    900: '#1A1A1A',
    950: '#0D0D0D',
  },

  // ============================================
  // ACCENT (Minimal - Dark charcoal)
  // ============================================
  accent: {
    50: '#F7F7F7',
    100: '#E4E4E4',
    200: '#D1D1D1',
    300: '#A0A0A0',
    400: '#6B6B6B',
    500: '#525252',
    600: '#3D3D3D',
    700: '#292929',
    800: '#1A1A1A', // Primary accent
    900: '#0D0D0D',
  },

  // ============================================
  // SEMANTIC COLORS
  // ============================================
  semantic: {
    success: {
      light: '#34C759',
      DEFAULT: '#30B350',
      dark: '#248A3D',
      bg: 'rgba(52, 199, 89, 0.12)',
    },
    warning: {
      light: '#FFB340',
      DEFAULT: '#FF9500',
      dark: '#C97800',
      bg: 'rgba(255, 149, 0, 0.12)',
    },
    error: {
      light: '#FF6961',
      DEFAULT: '#FF3B30',
      dark: '#D70015',
      bg: 'rgba(255, 59, 48, 0.12)',
    },
    info: {
      light: '#A0A0A0',
      DEFAULT: '#6B6B6B',
      dark: '#4A4A4A',
      bg: 'rgba(107, 107, 107, 0.12)',
    },
  },

  // ============================================
  // BACKGROUND (Clean white + muted white)
  // ============================================
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F7F7',
    tertiary: '#F0F0F0',
    inverse: '#1A1A1A',
    // Dark mode
    dark: {
      primary: '#0A0A0A',
      secondary: '#171717',
      tertiary: '#262626',
      inverse: '#FFFFFF',
    },
  },

  // ============================================
  // TEXT (Charcoal for readability)
  // ============================================
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    tertiary: '#7A7A7A',
    disabled: '#A0A0A0',
    inverse: '#FFFFFF',
    // Dark mode
    dark: {
      primary: '#FAFAFA',
      secondary: '#D4D4D4',
      tertiary: '#A3A3A3',
      disabled: '#525252',
      inverse: '#1A1A1A',
    },
  },

  // ============================================
  // OVERLAY
  // ============================================
  overlay: {
    light: 'rgba(255, 255, 255, 0.8)',
    medium: 'rgba(0, 0, 0, 0.4)',
    dark: 'rgba(0, 0, 0, 0.7)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },

} as const;

// Type exports for TypeScript
export type ColorToken = typeof colors;
export type NeutralShade = keyof typeof colors.neutral;
export type AccentShade = keyof typeof colors.accent;
