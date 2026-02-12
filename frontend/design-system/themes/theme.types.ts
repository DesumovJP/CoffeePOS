/**
 * ParadisePOS Design System - Theme Types
 *
 * Type definitions for theming system
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  accentColor?: string;
  reduceMotion?: boolean;
  highContrast?: boolean;
}

export interface TenantTheme {
  id: string;
  name: string;
  accentColor: string;
  logoUrl?: string;
  customCSS?: Record<string, string>;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  accentColor: string;
  reduceMotion: boolean;
  highContrast: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  toggleMode: () => void;
  setReduceMotion: (reduce: boolean) => void;
  setHighContrast: (highContrast: boolean) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultAccentColor?: string;
  storageKey?: string;
  tenantTheme?: TenantTheme;
}
