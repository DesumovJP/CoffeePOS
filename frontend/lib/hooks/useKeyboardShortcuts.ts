'use client';

/**
 * CoffeePOS - Keyboard Shortcuts Hook
 *
 * Configurable keyboard shortcut handler.
 * Ignores keypresses when user is typing in form fields.
 */

import { useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export interface ShortcutConfig {
  /** Key name (e.g. 'Enter', 'F1', 'Escape', 'Delete') */
  key: string;
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt key */
  alt?: boolean;
  /** Action to execute */
  action: () => void;
  /** Human-readable description (for UI) */
  description: string;
}

// ============================================
// HOOK
// ============================================

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (
          e.key === shortcut.key &&
          !!e.ctrlKey === !!shortcut.ctrl &&
          !!e.shiftKey === !!shortcut.shift &&
          !!e.altKey === !!shortcut.alt
        ) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
