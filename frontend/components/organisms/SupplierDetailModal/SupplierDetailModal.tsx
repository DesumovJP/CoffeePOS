'use client';

/**
 * CoffeePOS - SupplierDetailModal
 *
 * Shows full supplier profile: contact strip, next delivery status,
 * active deliveries, and history.
 */

import { useState, useMemo } from 'react';
import { Text, Button, Icon, Badge, Modal } from '@/components/atoms';
import { DataTable, type Column } from '@/components/organisms';
import { SupplierFormModal } from '@/components/organisms/SupplierFormModal';
import type { Supply, SupplyStatus, Supplier } from '@/lib/api';
import styles from './SupplierDetailModal.module.css';

// ============================================
// TYPES
// ============================================

export interface SupplierProfile {
  name: string;
  supplier?: Supplier | null; // real Supplier entity (may be null for legacy records)
  totalDeliveries: number;
  receivedDeliveries: number;
  pendingDeliveries: number;
  totalSpent: number;
  lastDeliveryDate: string | null;
  supplies: Supply[];
  ingredientCount?: number;
}

export interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierProfile | null;
  onNewSupply?: (supplierName: string) => void;
  onSupplierUpdated?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_LABELS: Record<SupplyStatus, string> = {
  draft: 'Чернетка',
  ordered: 'Замовлено',
  shipped: 'В дорозі',
  received: 'Отримано',
  cancelled: 'Скасовано',
};

const STATUS_VARIANTS: Record<SupplyStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  ordered: 'info',
  shipped: 'warning',
  received: 'success',
  cancelled: 'error',
};

const PENDING_STATUSES: SupplyStatus[] = ['draft', 'ordered', 'shipped'];

// ============================================
// HELPERS
// ============================================

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function formatTelegram(handle: string): string {
  const h = handle.trim();
  if (h.startsWith('+') || /^\d/.test(h)) return `https://t.me/${h}`;
  return `https://t.me/${h.replace(/^@/, '')}`;
}

// ============================================
// NEXT DELIVERY STATUS CARD
// ============================================

function NextDeliveryCard({ supplier }: { supplier: SupplierProfile }) {
  const activeDeliveries = supplier.supplies.filter((s) => PENDING_STATUSES.includes(s.status));
  const shipped = activeDeliveries.filter((s) => s.status === 'shipped');
  const ordered = activeDeliveries.filter((s) => s.status === 'ordered');
  const drafts = activeDeliveries.filter((s) => s.status === 'draft');

  // Find nearest expected delivery
  const withExpected = activeDeliveries
    .filter((s) => s.expectedAt)
    .sort((a, b) => new Date(a.expectedAt!).getTime() - new Date(b.expectedAt!).getTime());

  if (shipped.length > 0) {
    return (
      <div className={`${styles.deliveryCard} ${styles.deliveryCardWarning}`}>
        <Icon name="truck" size="sm" />
        <div className={styles.deliveryCardText}>
          <Text variant="labelMedium" weight="semibold">
            {shipped.length === 1 ? 'Посилка в дорозі' : `${shipped.length} посилки в дорозі`}
          </Text>
          {withExpected.length > 0 && (
            <Text variant="bodySmall" color="secondary">
              Очікується: {formatDate(withExpected[0].expectedAt)}
            </Text>
          )}
        </div>
      </div>
    );
  }

  if (ordered.length > 0) {
    return (
      <div className={`${styles.deliveryCard} ${styles.deliveryCardInfo}`}>
        <Icon name="clock" size="sm" />
        <div className={styles.deliveryCardText}>
          <Text variant="labelMedium" weight="semibold">
            {ordered.length === 1 ? 'Замовлення підтверджено' : `${ordered.length} замовлення підтверджено`}
          </Text>
          {withExpected.length > 0 && (
            <Text variant="bodySmall" color="secondary">
              Очікується: {formatDate(withExpected[0].expectedAt)}
            </Text>
          )}
        </div>
      </div>
    );
  }

  if (drafts.length > 0) {
    return (
      <div className={`${styles.deliveryCard} ${styles.deliveryCardDraft}`}>
        <Icon name="edit" size="sm" />
        <div className={styles.deliveryCardText}>
          <Text variant="labelMedium" weight="semibold">
            Є чернетка замовлення
          </Text>
          <Text variant="bodySmall" color="secondary">Підтвердіть або скасуйте</Text>
        </div>
      </div>
    );
  }

  // No pending — suggest reorder
  if (supplier.supplier?.reorderEveryDays && supplier.lastDeliveryDate) {
    const nextDate = new Date(supplier.lastDeliveryDate);
    nextDate.setDate(nextDate.getDate() + supplier.supplier.reorderEveryDays);
    const isPast = nextDate < new Date();
    return (
      <div className={`${styles.deliveryCard} ${isPast ? styles.deliveryCardWarning : styles.deliveryCardOk}`}>
        <Icon name={isPast ? 'warning' : 'check'} size="sm" />
        <div className={styles.deliveryCardText}>
          <Text variant="labelMedium" weight="semibold">
            {isPast ? 'Час замовляти!' : 'Наступне замовлення'}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {formatDate(nextDate.toISOString())} (кожні {supplier.supplier.reorderEveryDays} днів)
          </Text>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================
// CONTACT STRIP
// ============================================

function ContactStrip({ entity }: { entity: Supplier }) {
  const hasContacts = entity.phone || entity.telegram || entity.email || entity.contactPerson;
  if (!hasContacts) return null;

  return (
    <div className={styles.contactStrip}>
      {entity.contactPerson && (
        <div className={styles.contactItem}>
          <Icon name="user" size="sm" color="tertiary" />
          <Text variant="bodySmall" color="secondary">{entity.contactPerson}</Text>
        </div>
      )}
      {entity.phone && (
        <a href={`tel:${entity.phone}`} className={styles.contactLink}>
          <Icon name="phone" size="sm" color="tertiary" />
          <Text variant="bodySmall">{entity.phone}</Text>
        </a>
      )}
      {entity.telegram && (
        <a href={formatTelegram(entity.telegram)} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
          <Icon name="message-circle" size="sm" color="tertiary" />
          <Text variant="bodySmall">{entity.telegram}</Text>
        </a>
      )}
      {entity.email && (
        <a href={`mailto:${entity.email}`} className={styles.contactLink}>
          <Icon name="mail" size="sm" color="tertiary" />
          <Text variant="bodySmall">{entity.email}</Text>
        </a>
      )}
      {entity.paymentTerms && (
        <div className={styles.contactItem}>
          <Icon name="card" size="sm" color="tertiary" />
          <Text variant="bodySmall" color="secondary">{entity.paymentTerms}</Text>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPANDED ITEMS ROW
// ============================================

function SupplyItemsDetail({ supply }: { supply: Supply }) {
  if (!supply.items || supply.items.length === 0) {
    return (
      <div className={styles.itemsEmpty}>
        <Text variant="bodySmall" color="tertiary">Немає позицій</Text>
      </div>
    );
  }
  return (
    <div className={styles.itemsDetail}>
      <div className={styles.itemsHeader}>
        <Text variant="caption" color="tertiary" className={styles.itemsCol}>Інгредієнт</Text>
        <Text variant="caption" color="tertiary" className={styles.itemsColRight}>Кількість</Text>
        <Text variant="caption" color="tertiary" className={styles.itemsColRight}>Ціна/од.</Text>
        <Text variant="caption" color="tertiary" className={styles.itemsColRight}>Сума</Text>
      </div>
      {supply.items.map((item, i) => (
        <div key={i} className={styles.itemsRow}>
          <Text variant="bodySmall" className={styles.itemsCol}>{item.ingredientName || item.name || '—'}</Text>
          <Text variant="bodySmall" color="secondary" className={styles.itemsColRight}>{item.quantity}</Text>
          <Text variant="bodySmall" color="secondary" className={styles.itemsColRight}>₴{item.unitCost}</Text>
          <Text variant="bodySmall" weight="semibold" className={styles.itemsColRight}>₴{formatCurrency(item.totalCost)}</Text>
        </div>
      ))}
      <div className={styles.itemsFooter}>
        <Text variant="labelSmall" color="tertiary">Разом позицій: {supply.items.length}</Text>
        <Text variant="labelSmall" weight="semibold">₴{formatCurrency(supply.totalCost)}</Text>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
  onNewSupply,
  onSupplierUpdated,
}: SupplierDetailModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const activeSupplies = useMemo(
    () => supplier?.supplies.filter((s) => PENDING_STATUSES.includes(s.status)) ?? [],
    [supplier],
  );

  const historySupplies = useMemo(
    () => supplier?.supplies.filter((s) => s.status === 'received' || s.status === 'cancelled') ?? [],
    [supplier],
  );

  const columns: Column<Supply>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Дата',
      width: '110px',
      render: (s) => (
        <Text variant="bodySmall" color="secondary">
          {formatDate(s.receivedAt || s.orderedAt || s.createdAt)}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: '130px',
      render: (s) => (
        <Badge variant={STATUS_VARIANTS[s.status]} size="sm">
          {STATUS_LABELS[s.status]}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: 'Позицій',
      width: '80px',
      align: 'right',
      hideOnMobile: true,
      render: (s) => (
        <Text variant="bodySmall" color="secondary">{s.items?.length ?? 0}</Text>
      ),
    },
    {
      key: 'totalCost',
      header: 'Сума',
      width: '100px',
      align: 'right',
      render: (s) => (
        <Text variant="labelSmall" weight="semibold">₴{formatCurrency(s.totalCost)}</Text>
      ),
    },
    {
      key: 'chevron',
      header: '',
      width: '36px',
      align: 'right',
      render: () => <Icon name="chevron-right" size="sm" color="tertiary" />,
    },
  ], []);

  if (!supplier) return null;

  const entity = supplier.supplier;

  const footer = (
    <div className={styles.footer}>
      {entity && (
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
          <Icon name="edit" size="sm" />
          Редагувати
        </Button>
      )}
      {onNewSupply && (
        <Button
          variant="primary"
          onClick={() => { onClose(); onNewSupply(supplier.name); }}
        >
          <Icon name="plus" size="sm" />
          Нова поставка
        </Button>
      )}
      <Button variant="ghost" onClick={onClose}>Закрити</Button>
    </div>
  );

  const supplyDetailModal = selectedSupply ? (
    <Modal
      open={!!selectedSupply}
      onClose={() => setSelectedSupply(null)}
      title={`Поставка · ${formatDate(selectedSupply.receivedAt || selectedSupply.orderedAt || selectedSupply.createdAt)}`}
      icon="truck"
      size="sm"
    >
      <div className={styles.supplyDetailBody}>
        <div className={styles.supplyDetailMeta}>
          <Badge variant={STATUS_VARIANTS[selectedSupply.status]} size="sm">
            {STATUS_LABELS[selectedSupply.status]}
          </Badge>
          {selectedSupply.expectedAt && (
            <Text variant="caption" color="tertiary">
              Очікується: {formatDate(selectedSupply.expectedAt)}
            </Text>
          )}
          {selectedSupply.receivedBy && (
            <Text variant="caption" color="tertiary">
              Прийняв: {selectedSupply.receivedBy}
            </Text>
          )}
        </div>
        <SupplyItemsDetail supply={selectedSupply} />
      </div>
    </Modal>
  ) : null;

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={supplier.name}
        icon="truck"
        size="full"
        footer={footer}
      >
        <div className={styles.modalBody}>

          {/* Left: main content column */}
          <div className={styles.mainColumn}>

            {/* Contact strip — or CTA to create profile for legacy suppliers */}
            {entity ? (
              <>
                <ContactStrip entity={entity} />
                {entity.category && (
                  <div className={styles.metaRow}>
                    <Badge variant="default" size="sm">{entity.category}</Badge>
                    {entity.notes && (
                      <Text variant="bodySmall" color="tertiary">{entity.notes}</Text>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noProfileCta}>
                <div className={styles.noProfileText}>
                  <Text variant="labelMedium" weight="semibold">Немає контактної інформації</Text>
                  <Text variant="bodySmall" color="tertiary">
                    Додайте телефон, Telegram, контактну особу та умови роботи
                  </Text>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
                  <Icon name="plus" size="sm" />
                  Додати контакти
                </Button>
              </div>
            )}

            {/* Next delivery status */}
            <NextDeliveryCard supplier={supplier} />

            {/* Active deliveries */}
            {activeSupplies.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Text variant="labelMedium" weight="semibold">Активні поставки</Text>
                  <Badge variant="warning" size="sm">{activeSupplies.length}</Badge>
                </div>
                <DataTable
                  columns={columns}
                  data={activeSupplies}
                  getRowKey={(s) => s.documentId}
                  emptyState={{ icon: 'truck', title: 'Немає активних поставок' }}
                  onRowClick={(s) => setSelectedSupply(s)}
                />
              </div>
            )}

            {/* History (collapsed by default) */}
            {historySupplies.length > 0 && (
              <div className={styles.section}>
                <button
                  className={styles.historyToggle}
                  onClick={() => setShowHistory((v) => !v)}
                >
                  <Text variant="labelMedium" weight="semibold">
                    Історія поставок ({historySupplies.length})
                  </Text>
                  <Icon name={showHistory ? 'chevron-up' : 'chevron-down'} size="sm" />
                </button>
                {showHistory && (
                  <DataTable
                    columns={columns}
                    data={historySupplies}
                    getRowKey={(s) => s.documentId}
                    emptyState={{ icon: 'truck', title: 'Немає записів' }}
                    onRowClick={(s) => setSelectedSupply(s)}
                  />
                )}
              </div>
            )}

          </div>

          {/* Right: stats sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <Text variant="labelSmall" weight="semibold" color="secondary">Статистика</Text>
              <div className={styles.sidebarRow}>
                <Text variant="caption" color="tertiary">Всього поставок</Text>
                <Text variant="labelSmall" weight="semibold">{supplier.totalDeliveries}</Text>
              </div>
              <div className={styles.sidebarRow}>
                <Text variant="caption" color="tertiary">Отримано</Text>
                <Text variant="labelSmall" weight="semibold" color="success">{supplier.receivedDeliveries}</Text>
              </div>
              <div className={styles.sidebarRow}>
                <Text variant="caption" color="tertiary">Витрачено</Text>
                <Text variant="labelSmall" weight="semibold">₴{formatCurrency(supplier.totalSpent)}</Text>
              </div>
              <div className={styles.sidebarRow}>
                <Text variant="caption" color="tertiary">Остання поставка</Text>
                <Text variant="labelSmall" weight="semibold">{formatDate(supplier.lastDeliveryDate)}</Text>
              </div>
              {supplier.ingredientCount !== undefined && (
                <div className={styles.sidebarRow}>
                  <Text variant="caption" color="tertiary">Товарів</Text>
                  <Text variant="labelSmall" weight="semibold">{supplier.ingredientCount}</Text>
                </div>
              )}
            </div>
          </div>

        </div>
      </Modal>

      {/* Edit supplier form */}
      {entity && (
        <SupplierFormModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          supplier={entity}
          onSuccess={() => { onSupplierUpdated?.(); setEditOpen(false); }}
        />
      )}

      {/* Create profile for legacy supplier */}
      <SupplierFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        initialName={supplier?.name}
        onSuccess={() => { onSupplierUpdated?.(); setCreateOpen(false); }}
      />

      {/* Supply detail modal */}
      {supplyDetailModal}
    </>
  );
}

export default SupplierDetailModal;
