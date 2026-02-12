'use client';

/**
 * PageHeader - Unified page header component
 *
 * Replaces individual page headers with consistent design
 */

import { type ReactNode } from 'react';
import { Text } from '@/components/atoms';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Action buttons (right side) */
  actions?: ReactNode;
  /** Filter tabs or search (below title) */
  filters?: ReactNode;
  /** Additional className */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  filters,
  className,
}: PageHeaderProps) {
  return (
    <div className={`${styles.pageHeader} ${className || ''}`}>
      <div className={styles.titleRow}>
        <div className={styles.titleSection}>
          <Text variant="h4" weight="semibold">
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" color="secondary">
              {subtitle}
            </Text>
          )}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {filters && <div className={styles.filters}>{filters}</div>}
    </div>
  );
}

export default PageHeader;
