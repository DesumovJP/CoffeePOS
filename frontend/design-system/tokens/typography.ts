/**
 * ParadisePOS Design System - Typography Tokens
 *
 * System font stack optimized for iOS-like appearance
 * All typography scales defined here for consistency
 */

export const typography = {
  // ============================================
  // FONT FAMILIES
  // ============================================
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      '"SF Pro Text"',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),
    mono: [
      '"SF Mono"',
      'Monaco',
      '"Cascadia Code"',
      '"Roboto Mono"',
      'Consolas',
      '"Courier New"',
      'monospace',
    ].join(', '),
  },

  // ============================================
  // FONT SIZES
  // ============================================
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  // ============================================
  // LINE HEIGHTS
  // ============================================
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    // Specific for headings
    heading: '1.2',
    // Specific for body text
    body: '1.6',
  },

  // ============================================
  // FONT WEIGHTS
  // ============================================
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // ============================================
  // LETTER SPACING
  // ============================================
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // ============================================
  // TEXT VARIANTS (Semantic typography presets)
  // ============================================
  variants: {
    // Display - Large headlines
    displayLarge: {
      fontSize: '3.75rem',  // 60px
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    displayMedium: {
      fontSize: '3rem',     // 48px
      lineHeight: '1.15',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    displaySmall: {
      fontSize: '2.25rem',  // 36px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.02em',
    },

    // Headings
    h1: {
      fontSize: '2.25rem',  // 36px
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.875rem', // 30px
      lineHeight: '1.25',
      fontWeight: '600',
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '1.5rem',   // 24px
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.25rem',  // 20px
      lineHeight: '1.35',
      fontWeight: '600',
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1rem',     // 16px
      lineHeight: '1.5',
      fontWeight: '600',
      letterSpacing: '0',
    },

    // Body text
    bodyLarge: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.6',
      fontWeight: '400',
      letterSpacing: '0',
    },
    bodyMedium: {
      fontSize: '1rem',     // 16px
      lineHeight: '1.6',
      fontWeight: '400',
      letterSpacing: '0',
    },
    bodySmall: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0',
    },

    // Labels
    labelLarge: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0.01em',
    },
    labelMedium: {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0.02em',
    },
    labelSmall: {
      fontSize: '0.6875rem', // 11px
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0.02em',
    },

    // Caption
    caption: {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0.01em',
    },

    // Overline (all caps labels)
    overline: {
      fontSize: '0.6875rem', // 11px
      lineHeight: '1.5',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },

    // Button text
    buttonLarge: {
      fontSize: '1rem',     // 16px
      lineHeight: '1.25',
      fontWeight: '600',
      letterSpacing: '0.01em',
    },
    buttonMedium: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25',
      fontWeight: '600',
      letterSpacing: '0.01em',
    },
    buttonSmall: {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1.25',
      fontWeight: '600',
      letterSpacing: '0.02em',
    },

    // Numeric (prices, quantities)
    numericLarge: {
      fontSize: '1.5rem',   // 24px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.02em',
      fontVariantNumeric: 'tabular-nums' as const,
    },
    numericMedium: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.25',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      fontVariantNumeric: 'tabular-nums' as const,
    },
    numericSmall: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25',
      fontWeight: '500',
      letterSpacing: '0',
      fontVariantNumeric: 'tabular-nums' as const,
    },
  },
} as const;

// Type exports
export type TypographyToken = typeof typography;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TypographyVariant = keyof typeof typography.variants;
