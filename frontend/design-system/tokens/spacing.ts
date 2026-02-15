/**
 * CoffeePOS Design System - Spacing Tokens
 *
 * Consistent spacing scale based on 4px base unit
 * Used for margin, padding, gap, and positioning
 */

export const spacing = {
  // ============================================
  // BASE SCALE (4px increments)
  // ============================================
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px

  // ============================================
  // SEMANTIC SPACING
  // ============================================

  // Component internal padding
  component: {
    xs: '0.25rem',    // 4px - tight padding
    sm: '0.5rem',     // 8px - compact elements
    md: '0.75rem',    // 12px - standard padding
    lg: '1rem',       // 16px - comfortable padding
    xl: '1.5rem',     // 24px - spacious padding
  },

  // Gaps between elements
  gap: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
  },

  // Section spacing
  section: {
    sm: '1.5rem',     // 24px
    md: '2rem',       // 32px
    lg: '3rem',       // 48px
    xl: '4rem',       // 64px
    '2xl': '6rem',    // 96px
  },

  // Page margins
  page: {
    x: {
      mobile: '1rem',     // 16px
      tablet: '1.5rem',   // 24px
      desktop: '2rem',    // 32px
    },
    y: {
      mobile: '1rem',     // 16px
      tablet: '1.5rem',   // 24px
      desktop: '2rem',    // 32px
    },
  },

  // Inline spacing (between text/icons)
  inline: {
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
  },

  // Stack spacing (vertical rhythm)
  stack: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
  },
} as const;

// ============================================
// SIZING (Width/Height)
// ============================================
export const sizing = {
  // Fixed sizes
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',

  // Relative sizes
  auto: 'auto',
  full: '100%',
  screen: '100vh',
  screenWidth: '100vw',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',

  // Fractional
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',

  // Component specific
  icon: {
    xs: '0.75rem',    // 12px
    sm: '1rem',       // 16px
    md: '1.25rem',    // 20px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '2.5rem',  // 40px
  },

  avatar: {
    xs: '1.5rem',     // 24px
    sm: '2rem',       // 32px
    md: '2.5rem',     // 40px
    lg: '3rem',       // 48px
    xl: '4rem',       // 64px
    '2xl': '5rem',    // 80px
  },

  button: {
    height: {
      xs: '1.75rem',  // 28px
      sm: '2rem',     // 32px
      md: '2.5rem',   // 40px
      lg: '3rem',     // 48px
      xl: '3.5rem',   // 56px
    },
    minWidth: {
      xs: '4rem',     // 64px
      sm: '5rem',     // 80px
      md: '6rem',     // 96px
      lg: '8rem',     // 128px
    },
  },

  input: {
    height: {
      sm: '2rem',     // 32px
      md: '2.5rem',   // 40px
      lg: '3rem',     // 48px
    },
  },

  // Layout
  sidebar: {
    collapsed: '4rem',    // 64px
    expanded: '16rem',    // 256px
  },

  header: {
    height: '4rem',       // 64px
  },

  // Container max widths
  container: {
    xs: '20rem',      // 320px
    sm: '24rem',      // 384px
    md: '28rem',      // 448px
    lg: '32rem',      // 512px
    xl: '36rem',      // 576px
    '2xl': '42rem',   // 672px
    '3xl': '48rem',   // 768px
    '4xl': '56rem',   // 896px
    '5xl': '64rem',   // 1024px
    '6xl': '72rem',   // 1152px
    '7xl': '80rem',   // 1280px
    full: '100%',
  },
} as const;

// Type exports
export type SpacingToken = typeof spacing;
export type SizingToken = typeof sizing;
export type SpacingScale = keyof Omit<typeof spacing, 'component' | 'gap' | 'section' | 'page' | 'inline' | 'stack'>;
