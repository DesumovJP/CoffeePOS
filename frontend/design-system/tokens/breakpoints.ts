/**
 * ParadisePOS Design System - Breakpoint Tokens
 *
 * Responsive breakpoints for mobile-first design
 * Optimized for POS devices: tablets, touch screens, desktop monitors
 */

export const breakpoints = {
  // ============================================
  // BASE BREAKPOINTS (min-width)
  // ============================================
  values: {
    xs: 0,            // Extra small devices
    sm: 640,          // Small devices (phones landscape)
    md: 768,          // Medium devices (tablets portrait)
    lg: 1024,         // Large devices (tablets landscape, small laptops)
    xl: 1280,         // Extra large devices (desktops)
    '2xl': 1536,      // 2K monitors
    '3xl': 1920,      // Full HD monitors
    '4xl': 2560,      // 2K+ monitors
  },

  // ============================================
  // MEDIA QUERY STRINGS
  // ============================================
  up: {
    xs: '@media (min-width: 0px)',
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)',
    '3xl': '@media (min-width: 1920px)',
    '4xl': '@media (min-width: 2560px)',
  },

  down: {
    xs: '@media (max-width: 639px)',
    sm: '@media (max-width: 767px)',
    md: '@media (max-width: 1023px)',
    lg: '@media (max-width: 1279px)',
    xl: '@media (max-width: 1535px)',
    '2xl': '@media (max-width: 1919px)',
    '3xl': '@media (max-width: 2559px)',
  },

  only: {
    xs: '@media (max-width: 639px)',
    sm: '@media (min-width: 640px) and (max-width: 767px)',
    md: '@media (min-width: 768px) and (max-width: 1023px)',
    lg: '@media (min-width: 1024px) and (max-width: 1279px)',
    xl: '@media (min-width: 1280px) and (max-width: 1535px)',
    '2xl': '@media (min-width: 1536px) and (max-width: 1919px)',
    '3xl': '@media (min-width: 1920px)',
  },

  // ============================================
  // DEVICE-SPECIFIC
  // ============================================
  device: {
    // Touch devices
    touch: '@media (hover: none) and (pointer: coarse)',
    // Mouse/trackpad devices
    mouse: '@media (hover: hover) and (pointer: fine)',
    // Stylus (for signature pads)
    stylus: '@media (hover: none) and (pointer: fine)',

    // Orientation
    portrait: '@media (orientation: portrait)',
    landscape: '@media (orientation: landscape)',

    // High DPI displays
    retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',

    // Reduced motion preference
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
    noReducedMotion: '@media (prefers-reduced-motion: no-preference)',

    // Color scheme preference
    darkMode: '@media (prefers-color-scheme: dark)',
    lightMode: '@media (prefers-color-scheme: light)',

    // Print
    print: '@media print',
    screen: '@media screen',
  },

  // ============================================
  // POS-SPECIFIC BREAKPOINTS
  // ============================================
  pos: {
    // Small POS terminal (7-10 inch tablets)
    terminal: '@media (min-width: 768px) and (max-width: 1024px)',

    // Standard POS (10-15 inch touch screens)
    standard: '@media (min-width: 1024px) and (max-width: 1366px)',

    // Large POS (15+ inch displays)
    large: '@media (min-width: 1366px)',

    // Kitchen Display (wall-mounted, often in landscape)
    kds: '@media (min-width: 1024px) and (orientation: landscape)',

    // Customer Display (smaller, customer-facing)
    customer: '@media (max-width: 1024px)',
  },

  // ============================================
  // CONTAINER QUERIES (for component-level responsiveness)
  // ============================================
  container: {
    xs: '@container (min-width: 0px)',
    sm: '@container (min-width: 320px)',
    md: '@container (min-width: 480px)',
    lg: '@container (min-width: 640px)',
    xl: '@container (min-width: 800px)',
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get min-width media query for breakpoint
 */
export function mediaUp(breakpoint: keyof typeof breakpoints.values): string {
  return `@media (min-width: ${breakpoints.values[breakpoint]}px)`;
}

/**
 * Get max-width media query for breakpoint
 */
export function mediaDown(breakpoint: keyof typeof breakpoints.values): string {
  const bpValues = Object.values(breakpoints.values);
  const bpKeys = Object.keys(breakpoints.values) as Array<keyof typeof breakpoints.values>;
  const index = bpKeys.indexOf(breakpoint);

  if (index < bpValues.length - 1) {
    return `@media (max-width: ${bpValues[index + 1] - 1}px)`;
  }
  return `@media (max-width: ${breakpoints.values[breakpoint]}px)`;
}

/**
 * Get media query for range between two breakpoints
 */
export function mediaBetween(
  min: keyof typeof breakpoints.values,
  max: keyof typeof breakpoints.values
): string {
  return `@media (min-width: ${breakpoints.values[min]}px) and (max-width: ${breakpoints.values[max] - 1}px)`;
}

// Type exports
export type BreakpointToken = typeof breakpoints;
export type BreakpointScale = keyof typeof breakpoints.values;
