'use client';

/**
 * CoffeePOS - SupplierDetailModal
 *
 * Shows full supplier profile: stats + paginated supply history with item details.
 */

import { useState, useMemo } from 'react';
import { Text, Button, Icon, Badge, Modal } from '@/components/atoms';
import { DataTable, type Column } from '@/components/organisms';
import type { Supply, SupplyStatus } from '@/lib/api';
import styles from './SupplierDetailModal.module.css';

// ============================================
// TYPES
// ============================================

export interface SupplierProfile {
  name: string;
  totalDeliveries: number;
  receivedDeliveries: number;
  pendingDeliveries: number;
  totalSpent: number;
  lastDeliveryDate: string | null;
  supplies: Supply[];
}

export interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierProfile | null;
  onNewSupply?: (supplierName: string) => void;
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

type FilterTab = 'all' | 'pending' | 'received' | 'cancelled';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',       label: 'Всі' },
  { id: 'pending',   label: 'Очікується' },
  { id: 'received',  label: 'Отримано' },
  { id: 'cancelled', label: 'Скасовано' },
];

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
}: SupplierDetailModalProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredSupplies = useMemo(() => {
    if (!supplier) return [];
    switch (activeTab) {
      case 'pending':
        return supplier.supplies.filter((s) => PENDING_STATUSES.includes(s.status));
      case 'received':
        return supplier.supplies.filter((s) => s.status === 'received');
      case 'cancelled':
        return supplier.supplies.filter((s) => s.status === 'cancelled');
      default:
        return supplier.supplies;
    }
  }, [supplier, activeTab]);

  const columns: Column<Supply>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Дата',
      width: '120px',
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
      width: '90px',
      align: 'right',
      render: (s) => (
        <Text variant="bodySmall" color="secondary">
          {s.items?.length ?? 0}
        </Text>
      ),
    },
    {
      key: 'totalCost',
      header: 'Сума',
      width: '110px',
      align: 'right',
      render: (s) => (
        <Text variant="labelSmall" weight="semibold">
          ₴{formatCurrency(s.totalCost)}
        </Text>
      ),
    },
    {
      key: 'receivedBy',
      header: 'Отримав',
      width: '130px',
      hideOnMobile: true,
      render: (s) => (
        <Text variant="bodySmall" color="tertiary">
          {s.receivedBy || '—'}
        </Text>
      ),
    },
    {
      key: 'expand',
      header: '',
      width: '44px',
      align: 'right',
      render: (s) => (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId((prev) => (prev === s.documentId ? null : s.documentId));
          }}
          aria-label={expandedId === s.documentId ? 'Згорнути' : 'Деталі'}
        >
          <Icon
            name={expandedId === s.documentId ? 'chevron-up' : 'chevron-down'}
            size="sm"
          />
        </Button>
      ),
    },
  ], [expandedId]);

  if (!supplier) return null;

  const footer = (
    <div className={styles.footer}>
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={supplier.name}
      icon="truck"
      size="xl"
      footer={footer}
    >
      <div className={styles.content}>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{supplier.totalDeliveries}</span>
            <span className={styles.statLabel}>Всього поставок</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statSuccess}`}>{supplier.receivedDeliveries}</span>
            <span className={styles.statLabel}>Отримано</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statWarning}`}>{supplier.pendingDeliveries}</span>
            <span className={styles.statLabel}>Очікується</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>₴{formatCurrency(supplier.totalSpent)}</span>
            <span className={styles.statLabel}>Витрачено</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatDate(supplier.lastDeliveryDate)}</span>
            <span className={styles.statLabel}>Остання поставка</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {FILTER_TABS.map((tab) => {
            const count = tab.id === 'all'
              ? supplier.supplies.length
              : tab.id === 'pending'
              ? supplier.supplies.filter((s) => PENDING_STATUSES.includes(s.status)).length
              : tab.id === 'received'
              ? supplier.supplies.filter((s) => s.status === 'received').length
              : supplier.supplies.filter((s) => s.status === 'cancelled').length;

            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab(tab.id); setExpandedId(null); }}
              >
                {tab.label}
                {count > 0 && <span className={styles.tabCount}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredSupplies}
          getRowKey={(s) => s.documentId}
          emptyState={{ icon: 'truck', title: 'Поставок не знайдено' }}
          onRowClick={(s) => setExpandedId((prev) => (prev === s.documentId ? null : s.documentId))}
        />

        {/* Expanded detail */}
        {expandedId && (() => {
          const supply = filteredSupplies.find((s) => s.documentId === expandedId);
          if (!supply) return null;
          return (
            <div className={styles.expandedWrap}>
              <div className={styles.expandedHeader}>
                <Text variant="labelMedium" weight="semibold">
                  Деталі поставки від {formatDate(supply.receivedAt || supply.orderedAt || supply.createdAt)}
                </Text>
                <Button variant="ghost" size="sm" iconOnly onClick={() => setExpandedId(null)}>
                  <Icon name="close" size="sm" />
                </Button>
              </div>
              <SupplyItemsDetail supply={supply} />
            </div>
          );
        })()}
      </div>
    </Modal>
  );
}

export default SupplierDetailModal;
