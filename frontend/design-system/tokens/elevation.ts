/**
 * CoffeePOS Design System - Elevation Tokens
 *
 * Shadows, blur effects, and z-index scale
 * iOS 26 Liquid Glass elevation system
 */

export const elevation = {
  // ============================================
  // BOX SHADOWS
  // ============================================
  shadow: {
    none: 'none',

    // Subtle shadows
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

    // Small shadow
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',

    // Default shadow
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

    // Large shadow
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

    // Extra large
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

    // 2XL
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

    // Inner shadow
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

    // Glass shadow (for glass panels)
    glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
    glassHover: '0 12px 40px rgba(0, 0, 0, 0.16)',

    // Card shadows
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',

    // Button shadows
    button: '0 1px 2px rgba(0, 0, 0, 0.08)',
    buttonHover: '0 4px 12px rgba(0, 0, 0, 0.12)',

    // Modal/Popup shadows
    modal: '0 24px 48px rgba(0, 0, 0, 0.2)',
    popover: '0 4px 16px rgba(0, 0, 0, 0.12)',
    dropdown: '0 4px 16px rgba(0, 0, 0, 0.12)',
    tooltip: '0 2px 8px rgba(0, 0, 0, 0.15)',

    // Focus ring
    focus: '0 0 0 3px rgba(26, 26, 26, 0.15)',
    focusError: '0 0 0 3px rgba(255, 59, 48, 0.4)',

    // Colored shadows (subtle brand color in shadow)
    accent: '0 4px 14px rgba(26, 26, 26, 0.15)',
    success: '0 4px 14px rgba(52, 199, 89, 0.25)',
    warning: '0 4px 14px rgba(255, 149, 0, 0.25)',
    error: '0 4px 14px rgba(255, 59, 48, 0.25)',
  },

  // ============================================
  // BACKDROP BLUR (for glass effects)
  // ============================================
  blur: {
    none: '0',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',

    // Semantic
    glass: '24px',      // Standard glass effect
    glassLight: '16px', // Lighter blur
    glassHeavy: '40px', // Heavy blur
    overlay: '8px',     // For backdrop overlays
  },

  // ============================================
  // Z-INDEX SCALE
  // ============================================
  zIndex: {
    // Below normal
    behind: -1,

    // Base layers
    base: 0,
    docked: 10,

    // Interactive elements
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipNav: 1600,
    toast: 1700,
    tooltip: 1800,

    // Above everything
    max: 9999,
  },

  // ============================================
  // OPACITY SCALE
  // ============================================
  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    15: '0.15',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    85: '0.85',
    90: '0.9',
    95: '0.95',
    100: '1',

    // Semantic
    disabled: '0.5',
    placeholder: '0.6',
    secondary: '0.7',
    hover: '0.8',
    active: '0.9',
  },
} as const;

// Type exports
export type ElevationToken = typeof elevation;
export type ShadowScale = keyof typeof elevation.shadow;
export type BlurScale = keyof typeof elevation.blur;
export type ZIndexScale = keyof typeof elevation.zIndex;
