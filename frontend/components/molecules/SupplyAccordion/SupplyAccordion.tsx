'use client';

/**
 * SupplyAccordion - Expandable supply card component
 *
 * Displays supply summary in collapsed state, full details when expanded.
 * Used in Reports modal shift activity tabs.
 */

import { Text, Icon, Badge } from '@/components/atoms';
import styles from './SupplyAccordion.module.css';

// ============================================
// TYPES
// ============================================

export interface SupplyAccordionData {
  id: string;
  supplierName: string;
  status: string;
  items: Array<{ name: string; quantity: number; unitCost: number; totalCost: number }>;
  totalCost: number;
  createdAt: number;
  receivedBy?: string;
}

export interface SupplyAccordionProps {
  supply: SupplyAccordionData;
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================
// HELPERS
// ============================================

const STATUS_LABELS: Record<string, string> = {
  draft: 'Чернетка',
  ordered: 'Замовлено',
  shipped: 'В дорозі',
  received: 'Отримано',
  cancelled: 'Скасовано',
};

const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  ordered: 'info',
  shipped: 'warning',
  received: 'success',
  cancelled: 'error',
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

export function SupplyAccordion({ supply, isExpanded, onToggle }: SupplyAccordionProps) {
  // Compact preview: "Молоко 20л, Зерно 5кг, Цукор 10кг"
  const itemsPreview = supply.items.map((item) =>
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
          <div className={styles.supplierBadge}>
            <Icon name="truck" size="sm" />
          </div>
          <div className={styles.accordionMeta}>
            <div className={styles.metaRow}>
              <Text variant="labelMedium" weight="medium">{supply.supplierName}</Text>
              <span className={styles.metaDot} />
              <Text variant="caption" color="tertiary">{formatTime(supply.createdAt)}</Text>
              <Badge variant={STATUS_VARIANTS[supply.status] || 'default'} size="sm">
                {STATUS_LABELS[supply.status] || supply.status}
              </Badge>
            </div>
            <div className={styles.itemsPreview}>
              <Text variant="bodySmall" color="secondary">{itemsPreview}</Text>
            </div>
          </div>
        </div>
        <div className={styles.accordionRight}>
          <Text variant="labelLarge" weight="semibold" color="success">
            ₴{supply.totalCost.toFixed(0)}
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
              {supply.items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <Text variant="bodyMedium" weight="medium">{item.name}</Text>
                  <Text variant="bodySmall" color="secondary" className={styles.qtyCol}>{item.quantity}</Text>
                  <Text variant="bodySmall" color="secondary" className={styles.priceCol}>₴{item.unitCost.toFixed(2)}</Text>
                  <Text variant="bodyMedium" weight="semibold" className={styles.sumCol}>₴{item.totalCost.toFixed(0)}</Text>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            {supply.receivedBy && (
              <div className={styles.footerMeta}>
                <Icon name="user" size="sm" color="tertiary" />
                <Text variant="caption" color="tertiary">Прийняв: {supply.receivedBy}</Text>
              </div>
            )}
            <div className={styles.footerRow}>
              <Text variant="labelMedium" weight="semibold" color="secondary">Загалом</Text>
              <Text variant="labelLarge" weight="bold">₴{supply.totalCost.toFixed(0)}</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplyAccordion;
