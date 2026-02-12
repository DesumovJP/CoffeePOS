'use client';

/**
 * ParadisePOS Design System - Theme Provider
 *
 * Provides theme context and CSS variable injection
 * Handles light/dark mode, accent colors, and accessibility preferences
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type {
  ThemeMode,
  ThemeContextValue,
  ThemeProviderProps,
} from '../themes/theme.types';
import { generateCSSVariables, colors } from '../tokens';

// ============================================
// CONTEXT
// ============================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================
// HOOK
// ============================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

export function ThemeProvider({
  children,
  defaultMode = 'light',
  defaultAccentColor = colors.accent[800], // #1A1A1A - Dark charcoal
  storageKey = 'paradise-pos-theme',
  tenantTheme,
}: ThemeProviderProps) {
  // State
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [accentColor, setAccentColorState] = useState<string>(
    tenantTheme?.accentColor || defaultAccentColor
  );
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Resolve actual theme mode (light/dark) from mode setting
  const resolvedMode = useMemo((): 'light' | 'dark' => {
    if (mode === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light';
    }
    return mode;
  }, [mode]);

  // Load saved preferences on mount
  useEffect(() => {
    setMounted(true);

    // Load from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode) setModeState(parsed.mode);
        // Don't load accentColor from localStorage - use design system default
        if (parsed.reduceMotion !== undefined) {
          setReduceMotionState(parsed.reduceMotion);
        }
        if (parsed.highContrast !== undefined) {
          setHighContrastState(parsed.highContrast);
        }
      }
    } catch (e) {
      console.warn('Failed to load theme preferences:', e);
    }

    // Check system preference for reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setReduceMotionState(true);
    }

    // Listen for system color scheme changes
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        // Trigger re-render to update resolvedMode
        setModeState('system');
      }
    };
    darkQuery.addEventListener('change', handleChange);

    return () => {
      darkQuery.removeEventListener('change', handleChange);
    };
  }, [storageKey, tenantTheme, mode]);

  // Save preferences to localStorage
  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          mode,
          accentColor: tenantTheme ? undefined : accentColor,
          reduceMotion,
          highContrast,
        })
      );
    } catch (e) {
      console.warn('Failed to save theme preferences:', e);
    }
  }, [mode, accentColor, reduceMotion, highContrast, storageKey, tenantTheme, mounted]);

  // Apply CSS variables to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Generate and apply CSS variables
    const cssVars = generateCSSVariables(resolvedMode);
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply accent color
    root.style.setProperty('--color-accent', accentColor);

    // Calculate accent variants
    root.style.setProperty('--color-accent-hover', adjustColor(accentColor, -10));
    root.style.setProperty('--color-accent-active', adjustColor(accentColor, -20));
    root.style.setProperty('--color-accent-subtle', `${accentColor}1a`); // 10% opacity

    // Apply tenant custom CSS if provided
    if (tenantTheme?.customCSS) {
      Object.entries(tenantTheme.customCSS).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // Apply theme mode class
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedMode);

    // Apply accessibility classes
    root.classList.toggle('reduce-motion', reduceMotion);
    root.classList.toggle('high-contrast', highContrast);

    // Set color-scheme for native elements
    root.style.setProperty('color-scheme', resolvedMode);
  }, [resolvedMode, accentColor, reduceMotion, highContrast, tenantTheme, mounted]);

  // Setters
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    if (!tenantTheme) {
      setAccentColorState(color);
    }
  }, [tenantTheme]);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return 'dark'; // system -> dark
    });
  }, []);

  const setReduceMotion = useCallback((reduce: boolean) => {
    setReduceMotionState(reduce);
  }, []);

  const setHighContrast = useCallback((hc: boolean) => {
    setHighContrastState(hc);
  }, []);

  // Context value
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      accentColor,
      reduceMotion,
      highContrast,
      setMode,
      setAccentColor,
      toggleMode,
      setReduceMotion,
      setHighContrast,
    }),
    [
      mode,
      resolvedMode,
      accentColor,
      reduceMotion,
      highContrast,
      setMode,
      setAccentColor,
      toggleMode,
      setReduceMotion,
      setHighContrast,
    ]
  );

  // Prevent flash of incorrect theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Adjust hex color brightness
 * @param hex - Hex color string
 * @param percent - Percentage to adjust (-100 to 100)
 */
function adjustColor(hex: string, percent: number): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Adjust
  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100;
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  };

  // Convert back to hex
  const toHex = (value: number) => value.toString(16).padStart(2, '0');

  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

// ============================================
// EXPORTS
// ============================================

export { ThemeContext };
export type { ThemeContextValue, ThemeProviderProps };
