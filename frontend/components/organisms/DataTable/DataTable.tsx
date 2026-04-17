'use client';

/**
 * DataTable - Unified data table component
 *
 * Desktop: traditional sortable table
 * Mobile: automatic card list view — each row becomes a card
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
  /** Show this column in mobile card view (default: true for primary/numeric, false for action/meta) */
  showInCard?: boolean;
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
  /** Custom mobile card renderer (overrides auto-generated cards) */
  renderMobileCard?: (item: T, index: number) => ReactNode;
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

/** Determine if a column should show in mobile card view */
function showInCardView(col: Column<unknown>): boolean {
  if (col.showInCard !== undefined) return col.showInCard;
  // Default: show primary and numeric, hide action and meta
  if (col.type === 'action') return false;
  return true;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  emptyState,
  loading,
  getRowClassName,
  renderMobileCard,
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

  // Columns visible in card mode
  const cardColumns = columns.filter((c) => showInCardView(c as Column<unknown>));
  const primaryCol = columns.find((c) => c.type === 'primary');
  const secondaryCardCols = cardColumns.filter((c) => c.key !== primaryCol?.key);

  return (
    <>
      {/* Desktop/Tablet: Table view */}
      <GlassCard padding="none" className={`${styles.desktopTable} ${className || ''}`} elevated>
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

      {/* Mobile: Card list view */}
      <div className={`${styles.mobileCards} ${className || ''}`}>
        {data.map((item, index) => (
          <div
            key={getRowKey(item, index)}
            className={`${styles.mobileCard} ${onRowClick ? styles.clickable : ''} ${getRowClassName ? getRowClassName(item) : ''}`}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            {renderMobileCard ? (
              renderMobileCard(item, index)
            ) : (
              <>
                {/* Primary field — rendered as-is (includes thumbnail + name) */}
                {primaryCol && (
                  <div className={styles.cardTitle}>
                    {primaryCol.render
                      ? primaryCol.render(item, index)
                      : String((item as Record<string, unknown>)[primaryCol.key] ?? '')}
                  </div>
                )}
                {/* Secondary fields as inline row */}
                {secondaryCardCols.length > 0 && (
                  <div className={styles.cardFields}>
                    {secondaryCardCols.map((col) => (
                      <div key={col.key} className={`${styles.cardField} ${col.type === 'numeric' ? styles.cardFieldNumeric : ''}`}>
                        <span className={styles.cardFieldValue}>
                          {col.render
                            ? col.render(item, index)
                            : String((item as Record<string, unknown>)[col.key] ?? '')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {/* Chevron indicator for clickable cards */}
            {onRowClick && (
              <div className={styles.cardChevron}>
                <Icon name="chevron-right" size="sm" color="tertiary" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default DataTable;
