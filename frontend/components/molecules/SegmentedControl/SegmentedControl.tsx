'use client';

/**
 * SegmentedControl — full-width tab switcher (50/50, 33/33/33, etc.)
 *
 * Each option gets equal width. Active segment is elevated.
 * Matches the iOS 26 Liquid Glass design language.
 */

import type { HTMLAttributes } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption {
  id: string;
  label: string;
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
}

export function SegmentedControl({ options, value, onChange, className, ...rest }: SegmentedControlProps) {
  const cols = options.length;

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      {...rest}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={[styles.btn, value === opt.id ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
