'use client';

/**
 * DataTable - Unified data table component
 *
 * Replaces custom tables in Products, Inventory, Reports pages
 */

import { type ReactNode, type CSSProperties } from 'react';
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
  /** Inline style applied to every td in this column */
  cellStyle?: CSSProperties;
  /**
   * Column semantic type — controls visual treatment:
   * - 'primary'  : main identity column (name, title) — stronger visual weight
   * - 'action'   : edit/delete buttons — hidden until row hover
   * - 'meta'     : secondary info (dates, IDs) — muted color + smaller text
   * - 'numeric'  : prices, counts — tabular-nums, semibold, right-aligned
   */
  type?: 'primary' | 'action' | 'meta' | 'numeric';
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

function colClass(col: Column<unknown>): string {
  return [
    col.align ? styles[col.align] : '',
    col.hideOnMobile ? styles.hideOnMobile : '',
    col.hideOnTablet ? styles.hideOnTablet : '',
    col.type === 'primary' ? styles.primaryCell : '',
    col.type === 'action'  ? styles.actionCell  : '',
    col.type === 'meta'    ? styles.metaCell    : '',
    col.type === 'numeric' ? styles.numericCell : '',
  ].filter(Boolean).join(' ');
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
      <GlassCard padding="none" className={`${styles.fillCard} ${className || ''}`} elevated>
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
      <GlassCard padding="none" className={`${styles.fillCard} ${className || ''}`} elevated>
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
    <GlassCard padding="none" className={className} elevated>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={colClass(col as Column<unknown>)}
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
                className={[
                  onRowClick ? styles.clickable : '',
                  getRowClassName ? getRowClassName(item) : '',
                ].filter(Boolean).join(' ')}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={colClass(col as Column<unknown>)}
                    style={col.cellStyle}
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
