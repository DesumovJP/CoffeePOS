/**
 * ParadisePOS Design System - Border Radius Tokens
 *
 * iOS 26 inspired rounded corners
 * Consistent radius scale for all components
 */

export const radius = {
  // ============================================
  // BASE SCALE
  // ============================================
  none: '0',
  xs: '0.25rem',      // 4px  - subtle rounding
  sm: '0.375rem',     // 6px  - small elements
  md: '0.5rem',       // 8px  - default
  lg: '0.75rem',      // 12px - medium elements
  xl: '1rem',         // 16px - large elements
  '2xl': '1.5rem',    // 24px - cards, modals
  '3xl': '2rem',      // 32px - feature cards
  full: '9999px',     // pill shape

  // ============================================
  // SEMANTIC (Component-specific)
  // ============================================

  // Buttons
  button: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    pill: '9999px',
  },

  // Inputs
  input: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
  },

  // Cards
  card: {
    sm: '0.75rem',    // 12px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
  },

  // Modals and dialogs
  modal: '1.5rem',    // 24px

  // Popover, dropdown, tooltip
  popover: '0.75rem', // 12px

  // Tags and badges
  badge: '0.375rem',  // 6px
  tag: '9999px',      // pill

  // Avatar
  avatar: {
    square: '0.5rem', // 8px
    rounded: '9999px',
  },

  // Images
  image: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
  },

  // Container/Section
  container: '1.5rem', // 24px

  // Glass panels (iOS style)
  glass: '1.5rem',    // 24px
} as const;

// Type exports
export type RadiusToken = typeof radius;
export type RadiusScale = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
