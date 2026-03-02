'use client';

/**
 * CoffeePOS - Suppliers Page
 *
 * Aggregates Supply records by supplierName into SupplierProfile objects.
 * No dedicated Supplier content type in backend — computed on the frontend.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button, Icon, Badge, Spinner } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { DataTable, SupplierDetailModal, type Column } from '@/components/organisms';
import type { SupplierProfile } from '@/components/organisms/SupplierDetailModal/SupplierDetailModal';
import { useSupplies } from '@/lib/hooks';
import type { Supply } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const PENDING_STATUSES = new Set(['draft', 'ordered', 'shipped']);

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
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function buildProfiles(supplies: Supply[]): SupplierProfile[] {
  const map = new Map<string, Supply[]>();

  for (const supply of supplies) {
    const name = supply.supplierName || 'Невідомий постачальник';
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(supply);
  }

  return Array.from(map.entries()).map(([name, list]) => {
    const receivedDeliveries = list.filter((s) => s.status === 'received').length;
    const pendingDeliveries = list.filter((s) => PENDING_STATUSES.has(s.status)).length;
    const totalSpent = list
      .filter((s) => s.status === 'received')
      .reduce((sum, s) => sum + (s.totalCost || 0), 0);

    // Last delivery = most recent receivedAt, orderedAt, or createdAt among all statuses
    const dates = list
      .map((s) => s.receivedAt || s.orderedAt || s.createdAt)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());
    const lastDeliveryDate =
      dates.length > 0
        ? new Date(Math.max(...dates)).toISOString()
        : null;

    // Sort supplies newest first
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      name,
      totalDeliveries: list.length,
      receivedDeliveries,
      pendingDeliveries,
      totalSpent,
      lastDeliveryDate,
      supplies: sorted,
    };
  });
}

// ============================================
// COLUMNS
// ============================================

const columns: Column<SupplierProfile>[] = [
  {
    key: 'name',
    header: 'Постачальник',
    render: (p) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div className={styles.supplierIcon}>
          <Icon name="truck" size="sm" color="secondary" />
        </div>
        <Text variant="labelMedium" weight="semibold">{p.name}</Text>
      </div>
    ),
  },
  {
    key: 'totalDeliveries',
    header: 'Поставок',
    width: '100px',
    align: 'right',
    render: (p) => (
      <Text variant="bodySmall" weight="semibold">{p.totalDeliveries}</Text>
    ),
  },
  {
    key: 'receivedDeliveries',
    header: 'Отримано',
    width: '110px',
    align: 'right',
    hideOnMobile: true,
    render: (p) => (
      <Badge variant="success" size="sm">{p.receivedDeliveries}</Badge>
    ),
  },
  {
    key: 'pendingDeliveries',
    header: 'Очікується',
    width: '110px',
    align: 'right',
    hideOnMobile: true,
    render: (p) => (
      p.pendingDeliveries > 0
        ? <Badge variant="warning" size="sm">{p.pendingDeliveries}</Badge>
        : <Text variant="bodySmall" color="tertiary">—</Text>
    ),
  },
  {
    key: 'totalSpent',
    header: 'Витрачено',
    width: '130px',
    align: 'right',
    render: (p) => (
      <Text variant="labelSmall" weight="semibold">
        ₴{formatCurrency(p.totalSpent)}
      </Text>
    ),
  },
  {
    key: 'lastDeliveryDate',
    header: 'Остання поставка',
    width: '150px',
    hideOnMobile: true,
    render: (p) => (
      <Text variant="bodySmall" color="secondary">
        {formatDate(p.lastDeliveryDate)}
      </Text>
    ),
  },
];

// ============================================
// PAGE COMPONENT
// ============================================

export default function SuppliersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierProfile | null>(null);

  // Load ALL supplies (no pagination filtering — aggregate on frontend)
  const { data: supplies, isLoading } = useSupplies({ pageSize: 200, sort: 'createdAt:desc' });

  // Build supplier profiles
  const allProfiles = useMemo(
    () => buildProfiles(supplies || []),
    [supplies],
  );

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProfiles;
    return allProfiles.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProfiles, search]);

  // Sort: pending first, then by total deliveries desc
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (b.pendingDeliveries !== a.pendingDeliveries)
          return b.pendingDeliveries - a.pendingDeliveries;
        return b.totalDeliveries - a.totalDeliveries;
      }),
    [filtered],
  );

  // AppShell search event
  const handleSearchToggle = useCallback(() => setSearchVisible((v) => !v), []);

  useEffect(() => {
    window.addEventListener('appshell:search', handleSearchToggle);
    return () => window.removeEventListener('appshell:search', handleSearchToggle);
  }, [handleSearchToggle]);

  const handleNewSupply = useCallback(() => {
    // Navigate to products page which has the SuppliesPanel
    router.push('/admin/products');
  }, [router]);

  return (
    <div className={styles.page}>

      {/* Search bar */}
      {searchVisible && (
        <div className={styles.searchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук постачальника..."
            autoFocus
          />
          <Button variant="ghost" size="sm" iconOnly onClick={() => { setSearchVisible(false); setSearch(''); }} aria-label="Закрити пошук">
            <Icon name="close" size="sm" />
          </Button>
        </div>
      )}

      {/* Stats summary */}
      {!isLoading && allProfiles.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{allProfiles.length}</span>
            <span className={styles.summaryLabel}>Постачальників</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{supplies?.length ?? 0}</span>
            <span className={styles.summaryLabel}>Всього поставок</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryValue} ${styles.summaryWarning}`}>
              {allProfiles.reduce((s, p) => s + p.pendingDeliveries, 0)}
            </span>
            <span className={styles.summaryLabel}>Очікується</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>
              ₴{formatCurrency(allProfiles.reduce((s, p) => s + p.totalSpent, 0))}
            </span>
            <span className={styles.summaryLabel}>Загальні витрати</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className={styles.loadingState}>
          <Spinner size="lg" />
          <Text variant="bodyMedium" color="secondary">Завантаження постачальників...</Text>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={sorted}
          getRowKey={(p) => p.name}
          emptyState={{
            icon: 'truck',
            title: search ? 'Постачальників не знайдено' : 'Поставок ще немає',
            description: search ? 'Спробуйте інший запит' : 'Додайте першу поставку в розділі Продукція',
          }}
          onRowClick={(p) => setSelectedSupplier(p)}
        />
      )}

      {/* Supplier Detail Modal */}
      <SupplierDetailModal
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        supplier={selectedSupplier}
        onNewSupply={handleNewSupply}
      />
    </div>
  );
}
