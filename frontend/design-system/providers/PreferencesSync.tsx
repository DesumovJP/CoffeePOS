'use client';

/**
 * PreferencesSync — bridges usePreferencesStore with ThemeProvider
 *
 * Reads theme preference from Zustand store and syncs it to ThemeProvider.
 * Also applies density class and POS grid CSS vars on mount/change.
 */

import { useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { usePreferencesStore } from '@/lib/store/preferencesStore';

export function PreferencesSync() {
  const { mode, setMode } = useTheme();
  const theme = usePreferencesStore((s) => s.theme);
  const uiDensity = usePreferencesStore((s) => s.uiDensity);
  const posGridColumns = usePreferencesStore((s) => s.posGridColumns);
  const posCardSize = usePreferencesStore((s) => s.posCardSize);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);

  // Sync theme preference → ThemeProvider (only when values differ to avoid loops)
  useEffect(() => {
    if (theme !== mode) {
      setMode(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Sync density class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('density-compact', 'density-default', 'density-comfortable');
    root.classList.add(`density-${uiDensity}`);
  }, [uiDensity]);

  // Sync POS grid columns
  useEffect(() => {
    const root = document.documentElement;
    if (posGridColumns !== null) {
      root.style.setProperty('--pos-columns', String(posGridColumns));
    } else {
      root.style.removeProperty('--pos-columns');
    }
  }, [posGridColumns]);

  // Sync POS card size
  useEffect(() => {
    const cardSizeMap: Record<string, string> = {
      small: '100px',
      medium: '140px',
      large: '180px',
    };
    document.documentElement.style.setProperty(
      '--pos-card-min-width',
      cardSizeMap[posCardSize]
    );
  }, [posCardSize]);

  // Sync font size adjustment
  useEffect(() => {
    const fontAdjustMap: Record<string, string> = {
      small: '-1px',
      default: '0px',
      large: '2px',
    };
    document.documentElement.style.setProperty(
      '--font-size-adjust',
      fontAdjustMap[fontSize]
    );
  }, [fontSize]);

  // Sync animations
  useEffect(() => {
    const root = document.documentElement;
    if (!animationsEnabled) {
      root.classList.add('reduce-motion');
    } else {
      const systemPrefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (!systemPrefersReduced) {
        root.classList.remove('reduce-motion');
      }
    }
  }, [animationsEnabled]);

  return null;
}
