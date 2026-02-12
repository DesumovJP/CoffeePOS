'use client';

/**
 * DataTable - Unified data table component
 *
 * Replaces custom tables in Products, Inventory, Reports pages
 */

import { type ReactNode } from 'react';
import { Text, Icon, GlassCard, type IconName } from '@/components/atoms';
import styles from './DataTable.module.css';

export interface Column<T> {
  /** Unique column key */
  key: string;
  /** Header text */
  header: string;
  /** Custom render function */
  render?: (item: T, index: number) => ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Hide on tablet */
  hideOnTablet?: boolean;
  /** Column width */
  width?: string;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data array */
  data: T[];
  /** Unique key getter */
  getRowKey: (item: T, index: number) => string;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Empty state config */
  emptyState?: {
    icon: IconName;
    title: string;
    description?: string;
  };
  /** Loading state */
  loading?: boolean;
  /** Row class getter for conditional styling */
  getRowClassName?: (item: T) => string;
  /** Additional className */
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  emptyState,
  loading,
  getRowClassName,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <GlassCard padding="none" className={className}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <Text variant="bodySmall" color="secondary">
            Завантаження...
          </Text>
        </div>
      </GlassCard>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <GlassCard padding="none" className={className}>
        <div className={styles.empty}>
          <Icon name={emptyState.icon} size="xl" color="tertiary" />
          <Text variant="bodyMedium" color="secondary">
            {emptyState.title}
          </Text>
          {emptyState.description && (
            <Text variant="bodySmall" color="tertiary">
              {emptyState.description}
            </Text>
          )}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="none" className={className}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    ${col.align ? styles[col.align] : ''}
                    ${col.hideOnMobile ? styles.hideOnMobile : ''}
                    ${col.hideOnTablet ? styles.hideOnTablet : ''}
                  `}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className={`
                  ${onRowClick ? styles.clickable : ''}
                  ${getRowClassName ? getRowClassName(item) : ''}
                `}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      ${col.align ? styles[col.align] : ''}
                      ${col.hideOnMobile ? styles.hideOnMobile : ''}
                      ${col.hideOnTablet ? styles.hideOnTablet : ''}
                    `}
                  >
                    {col.render
                      ? col.render(item, index)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

export default DataTable;
