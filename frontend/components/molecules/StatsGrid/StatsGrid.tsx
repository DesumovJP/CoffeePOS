'use client';

/**
 * StatsGrid - Unified statistics display component
 *
 * Replaces custom stat cards in Products, Inventory, Reports pages
 */

import { Text, Icon, GlassCard, type IconName } from '@/components/atoms';
import styles from './StatsGrid.module.css';

export interface StatItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Value to display (number or formatted string) */
  value: string | number;
  /** Icon name */
  icon: IconName;
  /** Icon color variant */
  iconColor?: 'accent' | 'success' | 'warning' | 'error' | 'info';
  /** Optional trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  /** Highlight card (e.g., for warnings) */
  highlight?: boolean;
}

export interface StatsGridProps {
  /** Array of stat items */
  stats: StatItem[];
  /** Number of columns (auto-responsive if not specified) */
  columns?: 2 | 3 | 4;
  /** Display variant: grid (default cards) or bar (compact single-row strip) */
  variant?: 'grid' | 'bar';
  /** Additional className */
  className?: string;
}

export function StatsGrid({ stats, columns, variant = 'grid', className }: StatsGridProps) {
  if (variant === 'bar') {
    return (
      <GlassCard padding="sm" className={`${styles.bar} ${className || ''}`}>
        {stats.map((stat, index) => (
          <div key={stat.id} className={`${styles.barItem} ${index < stats.length - 1 ? styles.barDivider : ''}`}>
            <div className={`${styles.barIcon} ${stat.iconColor ? styles[stat.iconColor] : ''}`}>
              <Icon name={stat.icon} size="sm" />
            </div>
            <Text variant="h4" weight="semibold" className={styles.barValue}>
              {stat.value}
            </Text>
            <Text variant="caption" color="secondary">
              {stat.label}
            </Text>
          </div>
        ))}
      </GlassCard>
    );
  }

  return (
    <div
      className={`${styles.grid} ${columns ? styles[`cols${columns}`] : ''} ${className || ''}`}
    >
      {stats.map((stat) => (
        <GlassCard
          key={stat.id}
          padding="md"
          className={`${styles.card} ${stat.highlight ? styles.highlight : ''}`}
        >
          <div className={`${styles.iconWrapper} ${stat.iconColor ? styles[stat.iconColor] : ''}`}>
            <Icon name={stat.icon} size="md" />
          </div>
          <div className={styles.content}>
            <Text variant="h4" weight="semibold" className={styles.value}>
              {stat.value}
            </Text>
            <Text variant="caption" color="secondary" className={styles.label}>
              {stat.label}
            </Text>
          </div>
          {stat.trend && (
            <div className={`${styles.trend} ${styles[stat.trend.direction]}`}>
              <Icon
                name={stat.trend.direction === 'up' ? 'chevron-up' : 'chevron-down'}
                size="xs"
              />
              <span>{Math.abs(stat.trend.value)}%</span>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

export default StatsGrid;
