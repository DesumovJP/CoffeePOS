/**
 * CoffeePOS - User Preferences Store
 *
 * Manages UI preferences: theme, density, POS grid, font size, animations.
 * Persisted to localStorage. Integrates with ThemeProvider and CSS custom properties.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type UIDensity = 'compact' | 'default' | 'comfortable';
export type POSCardSize = 'small' | 'medium' | 'large';
export type FontSizePreference = 'small' | 'default' | 'large';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface PreferencesState {
  /** Theme mode */
  theme: ThemePreference;
  /** UI density (affects spacing, padding, row heights) */
  uiDensity: UIDensity;
  /** POS terminal grid columns (user override, null = auto) */
  posGridColumns: number | null;
  /** POS product card size */
  posCardSize: POSCardSize;
  /** Sidebar collapsed on desktop */
  sidebarCollapsed: boolean;
  /** Table row density */
  tableRowDensity: UIDensity;
  /** Enable/disable animations */
  animationsEnabled: boolean;
  /** Font size preference */
  fontSize: FontSizePreference;
  /** POS: show prices on cards */
  posShowPrices: boolean;
  /** POS: show images on cards */
  posShowImages: boolean;
}

export interface PreferencesActions {
  setTheme: (theme: ThemePreference) => void;
  setUIDensity: (density: UIDensity) => void;
  setPosGridColumns: (columns: number | null) => void;
  setPosCardSize: (size: POSCardSize) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTableRowDensity: (density: UIDensity) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setFontSize: (size: FontSizePreference) => void;
  setPosShowPrices: (show: boolean) => void;
  setPosShowImages: (show: boolean) => void;
  resetToDefaults: () => void;
}

// ============================================
// DEFAULTS
// ============================================

const defaultPreferences: PreferencesState = {
  theme: 'system',
  uiDensity: 'default',
  posGridColumns: null, // auto — CSS handles responsive columns
  posCardSize: 'medium',
  sidebarCollapsed: false,
  tableRowDensity: 'default',
  animationsEnabled: true,
  fontSize: 'default',
  posShowPrices: true,
  posShowImages: true,
};

// ============================================
// CSS SYNC
// ============================================

/**
 * Apply preferences as CSS custom properties on <html>
 * Called on every preference change.
 */
function syncCSSProperties(state: PreferencesState): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Density class
  root.classList.remove('density-compact', 'density-default', 'density-comfortable');
  root.classList.add(`density-${state.uiDensity}`);

  // POS grid columns (null = auto, CSS handles it)
  if (state.posGridColumns !== null) {
    root.style.setProperty('--pos-columns', String(state.posGridColumns));
  } else {
    root.style.removeProperty('--pos-columns');
  }

  // POS card size
  const cardSizeMap: Record<POSCardSize, string> = {
    small: '100px',
    medium: '140px',
    large: '180px',
  };
  root.style.setProperty('--pos-card-min-width', cardSizeMap[state.posCardSize]);

  // Font size adjustment
  const fontAdjustMap: Record<FontSizePreference, string> = {
    small: '-1px',
    default: '0px',
    large: '2px',
  };
  root.style.setProperty('--font-size-adjust', fontAdjustMap[state.fontSize]);

  // Animations
  if (!state.animationsEnabled) {
    root.classList.add('reduce-motion');
  } else {
    // Only remove if not set by system preference
    const systemPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!systemPrefersReduced) {
      root.classList.remove('reduce-motion');
    }
  }
}

// ============================================
// STORE
// ============================================

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      setTheme: (theme) => set({ theme }),

      setUIDensity: (uiDensity) => {
        set({ uiDensity });
        syncCSSProperties({ ...get(), uiDensity });
      },

      setPosGridColumns: (posGridColumns) => {
        set({ posGridColumns });
        syncCSSProperties({ ...get(), posGridColumns });
      },

      setPosCardSize: (posCardSize) => {
        set({ posCardSize });
        syncCSSProperties({ ...get(), posCardSize });
      },

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setTableRowDensity: (tableRowDensity) => set({ tableRowDensity }),

      setAnimationsEnabled: (animationsEnabled) => {
        set({ animationsEnabled });
        syncCSSProperties({ ...get(), animationsEnabled });
      },

      setFontSize: (fontSize) => {
        set({ fontSize });
        syncCSSProperties({ ...get(), fontSize });
      },

      setPosShowPrices: (posShowPrices) => set({ posShowPrices }),

      setPosShowImages: (posShowImages) => set({ posShowImages }),

      resetToDefaults: () => {
        set(defaultPreferences);
        syncCSSProperties(defaultPreferences);
      },
    }),
    {
      name: 'paradise-pos-preferences',
      // Sync CSS on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state) {
          syncCSSProperties(state);
        }
      },
    }
  )
);
