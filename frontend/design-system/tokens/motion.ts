/**
 * CoffeePOS Design System - Motion Tokens
 *
 * Animation durations, easing functions, and transitions
 * iOS-inspired subtle, responsive animations
 * Includes reduce-motion accessibility support
 */

export const motion = {
  // ============================================
  // DURATION
  // ============================================
  duration: {
    instant: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    moderate: '250ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',

    // Semantic
    hover: '150ms',
    focus: '150ms',
    active: '100ms',
    enter: '200ms',
    exit: '150ms',
    expand: '250ms',
    collapse: '200ms',
    fade: '200ms',
    slide: '250ms',
    scale: '200ms',
    skeleton: '1500ms', // For loading skeletons
  },

  // ============================================
  // EASING (Timing Functions)
  // ============================================
  easing: {
    // Standard easings
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',

    // Custom cubic-bezier (iOS-inspired)
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Smooth default
    in: 'cubic-bezier(0.4, 0, 1, 1)',             // Accelerate
    out: 'cubic-bezier(0, 0, 0.2, 1)',            // Decelerate
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',        // Accelerate-Decelerate

    // Spring-like (iOS bounce)
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    springGentle: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    springBouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

    // Emphasis (for attention-grabbing animations)
    emphasisIn: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    emphasisOut: 'cubic-bezier(0.3, 0, 0.8, 0.15)',

    // Sharp (quick actions)
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

    // Smooth (content transitions)
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // ============================================
  // TRANSITIONS (Presets)
  // ============================================
  transition: {
    // Common property transitions
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color, background-color, border-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',

    // Component-specific
    button: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    input: 'border-color 150ms ease, box-shadow 150ms ease',
    card: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    modal: 'opacity 200ms ease, transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    tooltip: 'opacity 150ms ease, transform 150ms ease',
    dropdown: 'opacity 150ms ease, transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',

    // None (for reduce-motion)
    none: 'none',
  },

  // ============================================
  // KEYFRAME ANIMATIONS
  // ============================================
  animation: {
    // Fade
    fadeIn: 'fadeIn 200ms ease forwards',
    fadeOut: 'fadeOut 150ms ease forwards',

    // Scale
    scaleIn: 'scaleIn 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    scaleOut: 'scaleOut 150ms ease forwards',

    // Slide
    slideUp: 'slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    slideDown: 'slideDown 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    slideLeft: 'slideLeft 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    slideRight: 'slideRight 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',

    // Bounce
    bounce: 'bounce 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounceIn: 'bounceIn 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',

    // Pulse
    pulse: 'pulse 2000ms cubic-bezier(0.4, 0, 0.6, 1) infinite',
    pulseOnce: 'pulse 1000ms cubic-bezier(0.4, 0, 0.6, 1)',

    // Spin
    spin: 'spin 1000ms linear infinite',

    // Shake (for errors)
    shake: 'shake 500ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',

    // Skeleton loading
    skeleton: 'skeleton 1500ms ease-in-out infinite',

    // Success checkmark
    checkmark: 'checkmark 300ms ease forwards',

    // Attention
    wiggle: 'wiggle 500ms ease-in-out',
    ping: 'ping 1000ms cubic-bezier(0, 0, 0.2, 1) infinite',
  },

  // ============================================
  // KEYFRAMES (CSS @keyframes definitions)
  // ============================================
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    scaleIn: {
      from: { opacity: '0', transform: 'scale(0.95)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    scaleOut: {
      from: { opacity: '1', transform: 'scale(1)' },
      to: { opacity: '0', transform: 'scale(0.95)' },
    },
    slideUp: {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    slideDown: {
      from: { opacity: '0', transform: 'translateY(-10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    slideLeft: {
      from: { opacity: '0', transform: 'translateX(10px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    slideRight: {
      from: { opacity: '0', transform: 'translateX(-10px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    bounceIn: {
      '0%': { opacity: '0', transform: 'scale(0.3)' },
      '50%': { transform: 'scale(1.05)' },
      '70%': { transform: 'scale(0.9)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    shake: {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
    },
    skeleton: {
      '0%': { backgroundPosition: '200% 0' },
      '100%': { backgroundPosition: '-200% 0' },
    },
    checkmark: {
      '0%': { strokeDashoffset: '50' },
      '100%': { strokeDashoffset: '0' },
    },
    wiggle: {
      '0%, 100%': { transform: 'rotate(0deg)' },
      '25%': { transform: 'rotate(-3deg)' },
      '75%': { transform: 'rotate(3deg)' },
    },
    ping: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '75%, 100%': { transform: 'scale(2)', opacity: '0' },
    },
  },

  // ============================================
  // DELAYS
  // ============================================
  delay: {
    none: '0ms',
    shorter: '50ms',
    short: '100ms',
    medium: '200ms',
    long: '300ms',
    longer: '500ms',
  },
} as const;

// Type exports
export type MotionToken = typeof motion;
export type DurationScale = keyof typeof motion.duration;
export type EasingScale = keyof typeof motion.easing;
export type AnimationScale = keyof typeof motion.animation;
