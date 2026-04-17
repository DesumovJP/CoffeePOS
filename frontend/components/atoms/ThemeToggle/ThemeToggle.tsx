'use client';

/**
 * ThemeToggle — Light/Dark/System theme switcher
 *
 * Compact mode: icon button that cycles through modes
 * Expanded mode: segmented control with labels (for settings page)
 */

import { useCallback } from 'react';
import { Icon } from '../Icon';
import { usePreferencesStore, type ThemePreference } from '@/lib/store/preferencesStore';
import styles from './ThemeToggle.module.css';

export interface ThemeToggleProps {
  /** Compact = icon button, expanded = segmented control */
  variant?: 'compact' | 'expanded';
  className?: string;
}

const modeIcons: Record<ThemePreference, { icon: 'sun' | 'moon' | 'settings'; label: string }> = {
  light: { icon: 'sun', label: 'Світла' },
  dark: { icon: 'moon', label: 'Темна' },
  system: { icon: 'settings', label: 'Система' },
};

const cycleOrder: ThemePreference[] = ['light', 'dark', 'system'];

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);

  const cycleTheme = useCallback(() => {
    const currentIndex = cycleOrder.indexOf(theme);
    const next = cycleOrder[(currentIndex + 1) % cycleOrder.length];
    setTheme(next);
  }, [theme, setTheme]);

  if (variant === 'compact') {
    const { icon, label } = modeIcons[theme];
    return (
      <button
        className={`${styles.compactBtn} ${className || ''}`}
        onClick={cycleTheme}
        aria-label={`Тема: ${label}. Натисніть для зміни`}
        title={`Тема: ${label}`}
      >
        <span className={styles.iconWrap} key={theme}>
          <Icon name={icon} size="sm" />
        </span>
      </button>
    );
  }

  // Expanded: segmented control
  return (
    <div className={`${styles.segmented} ${className || ''}`} role="radiogroup" aria-label="Тема оформлення">
      {cycleOrder.map((mode) => {
        const { icon, label } = modeIcons[mode];
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            className={`${styles.segment} ${isActive ? styles.segmentActive : ''}`}
            onClick={() => setTheme(mode)}
            role="radio"
            aria-checked={isActive}
          >
            <Icon name={icon} size="sm" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
