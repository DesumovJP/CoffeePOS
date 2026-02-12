'use client';

/**
 * WriteoffAccordion - Expandable write-off card component
 *
 * Displays write-off summary in collapsed state, full details when expanded.
 * Used in Reports modal shift activity tabs.
 */

import { Text, Icon, Badge } from '@/components/atoms';
import styles from './WriteoffAccordion.module.css';

// ============================================
// TYPES
// ============================================

export interface WriteoffAccordionData {
  id: string;
  type: string;
  reason?: string;
  items: Array<{ name: string; quantity: number; unitCost: number; totalCost: number }>;
  totalCost: number;
  createdAt: number;
  performedBy?: string;
}

export interface WriteoffAccordionProps {
  writeoff: WriteoffAccordionData;
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================
// HELPERS
// ============================================

const TYPE_LABELS: Record<string, string> = {
  expired: 'Прострочений',
  damaged: 'Пошкоджений',
  other: 'Інше',
};

const TYPE_VARIANTS: Record<string, 'default' | 'warning' | 'error'> = {
  expired: 'warning',
  damaged: 'error',
  other: 'default',
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// COMPONENT
// ============================================

export function WriteoffAccordion({ writeoff, isExpanded, onToggle }: WriteoffAccordionProps) {
  // Compact preview: "Молоко 2л, Вершки 0.5л"
  const itemsPreview = writeoff.items.map((item) =>
    `${item.name} ${item.quantity}`
  ).join(', ');

  return (
    <div className={`${styles.accordion} ${isExpanded ? styles.expanded : ''}`}>
      <button
        className={styles.accordionHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className={styles.accordionLeft}>
          <div className={styles.typeBadge}>
            <Icon name="delete" size="sm" />
          </div>
          <div className={styles.accordionMeta}>
            <div className={styles.metaRow}>
              <Badge variant={TYPE_VARIANTS[writeoff.type] || 'default'} size="sm">
                {TYPE_LABELS[writeoff.type] || writeoff.type}
              </Badge>
              {writeoff.reason && (
                <Text variant="labelMedium" weight="medium">{writeoff.reason}</Text>
              )}
              <span className={styles.metaDot} />
              <Text variant="caption" color="tertiary">{formatTime(writeoff.createdAt)}</Text>
              {writeoff.performedBy && (
                <>
                  <span className={styles.metaDot} />
                  <Text variant="caption" color="tertiary">{writeoff.performedBy}</Text>
                </>
              )}
            </div>
            <div className={styles.itemsPreview}>
              <Text variant="bodySmall" color="secondary">{itemsPreview}</Text>
            </div>
          </div>
        </div>
        <div className={styles.accordionRight}>
          <Text variant="labelLarge" weight="semibold" color="error">
            -₴{writeoff.totalCost.toFixed(0)}
          </Text>
          <div className={`${styles.accordionChevron} ${isExpanded ? styles.rotated : ''}`}>
            <Icon name="chevron-down" size="sm" color="tertiary" />
          </div>
        </div>
      </button>

      <div className={styles.accordionContent}>
        <div className={styles.accordionBody}>
          {/* Table */}
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <Text variant="caption" color="tertiary">Позиція</Text>
              <Text variant="caption" color="tertiary">К-сть</Text>
              <Text variant="caption" color="tertiary">Ціна/од.</Text>
              <Text variant="caption" color="tertiary">Сума</Text>
            </div>

            <div className={styles.itemsList}>
              {writeoff.items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <Text variant="bodyMedium" weight="medium">{item.name}</Text>
                  <Text variant="bodySmall" color="secondary" className={styles.qtyCol}>{item.quantity}</Text>
                  <Text variant="bodySmall" color="secondary" className={styles.priceCol}>₴{item.unitCost.toFixed(2)}</Text>
                  <Text variant="bodyMedium" weight="semibold" color="error" className={styles.sumCol}>-₴{item.totalCost.toFixed(0)}</Text>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            {writeoff.performedBy && (
              <div className={styles.footerMeta}>
                <Icon name="user" size="sm" color="tertiary" />
                <Text variant="caption" color="tertiary">Списав: {writeoff.performedBy}</Text>
              </div>
            )}
            <div className={styles.footerRow}>
              <Text variant="labelMedium" weight="semibold" color="secondary">Загалом</Text>
              <Text variant="labelLarge" weight="bold" color="error">-₴{writeoff.totalCost.toFixed(0)}</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WriteoffAccordion;
