'use client';

/**
 * CoffeePOS - Suppliers Page
 *
 * Lists Supplier entities with contact info, active delivery status, and CRUD.
 * Also handles legacy supply records that have supplierName but no Supplier entity.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Text, Button, Icon, Badge, Spinner } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { DataTable, SupplierDetailModal, SupplierFormModal, type Column, type SupplierProfile } from '@/components/organisms';
import { useSupplies, useSuppliers, useDeleteSupplier } from '@/lib/hooks';
import type { Supply, SupplyStatus, Supplier } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const PENDING_STATUSES = new Set<SupplyStatus>(['draft', 'ordered', 'shipped']);

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

// Sort priority for active status (lower = more urgent)
const STATUS_PRIORITY: Record<SupplyStatus, number> = {
  shipped: 0,
  ordered: 1,
  draft: 2,
  received: 3,
  cancelled: 4,
};

// ============================================
// HELPERS
// ============================================

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

// ============================================
// PROFILE BUILDER
// Merges Supplier entities + supplies into enriched SupplierProfile objects.
// Handles both linked supplies (via supplier.documentId) and legacy supplierName matching.
// ============================================

function buildProfiles(suppliers: Supplier[], supplies: Supply[]): SupplierProfile[] {
  const profiles: SupplierProfile[] = [];
  const handledNames = new Set<string>();

  // Supplier entity → profile
  for (const supplier of suppliers) {
    const name = supplier.name;
    handledNames.add(name.toLowerCase());

    // Find supplies by relation documentId or by name (fallback)
    const list = supplies.filter(
      (s) =>
        s.supplier?.documentId === supplier.documentId ||
        (!s.supplier && s.supplierName?.toLowerCase() === name.toLowerCase()),
    );

    const receivedDeliveries = list.filter((s) => s.status === 'received').length;
    const pendingDeliveries = list.filter((s) => PENDING_STATUSES.has(s.status)).length;
    const totalSpent = list
      .filter((s) => s.status === 'received')
      .reduce((sum, s) => sum + (s.totalCost || 0), 0);

    const dates = list
      .map((s) => s.receivedAt || s.orderedAt || s.createdAt)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());
    const lastDeliveryDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    profiles.push({
      name,
      supplier,
      totalDeliveries: list.length,
      receivedDeliveries,
      pendingDeliveries,
      totalSpent,
      lastDeliveryDate,
      supplies: sorted,
    });
  }

  // Legacy: supplies with supplierName that didn't match any Supplier entity
  const legacyMap = new Map<string, Supply[]>();
  for (const s of supplies) {
    const name = s.supplierName || 'Невідомий постачальник';
    if (handledNames.has(name.toLowerCase())) continue;
    if (!legacyMap.has(name)) legacyMap.set(name, []);
    legacyMap.get(name)!.push(s);
  }

  for (const [name, list] of legacyMap) {
    const receivedDeliveries = list.filter((s) => s.status === 'received').length;
    const pendingDeliveries = list.filter((s) => PENDING_STATUSES.has(s.status)).length;
    const totalSpent = list
      .filter((s) => s.status === 'received')
      .reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const dates = list
      .map((s) => s.receivedAt || s.orderedAt || s.createdAt)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());
    const lastDeliveryDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    profiles.push({
      name,
      supplier: null,
      totalDeliveries: list.length,
      receivedDeliveries,
      pendingDeliveries,
      totalSpent,
      lastDeliveryDate,
      supplies: sorted,
    });
  }

  return profiles;
}

// ============================================
// GET ACTIVE STATUS for a profile
// Returns the most urgent pending supply status, or null.
// ============================================

function getActiveStatus(profile: SupplierProfile): { status: SupplyStatus; expectedAt?: string } | null {
  const pending = profile.supplies.filter((s) => PENDING_STATUSES.has(s.status));
  if (pending.length === 0) return null;
  const sorted = [...pending].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status],
  );
  return { status: sorted[0].status, expectedAt: sorted[0].expectedAt };
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SupplierProfile | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading: loadingSuppliers, refetch: refetchSuppliers } = useSuppliers();
  const { data: supplies = [], isLoading: loadingSupplies } = useSupplies({ pageSize: 200, sort: 'createdAt:desc' });
  const deleteSupplier = useDeleteSupplier();

  const isLoading = loadingSuppliers || loadingSupplies;

  const allProfiles = useMemo(
    () => buildProfiles(suppliers, supplies),
    [suppliers, supplies],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProfiles;
    return allProfiles.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.supplier?.contactPerson?.toLowerCase().includes(q) ||
      p.supplier?.category?.toLowerCase().includes(q),
    );
  }, [allProfiles, search]);

  // Sort: shipped → ordered → draft → received (by last delivery date)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aPriority = getActiveStatus(a)?.status ?? 'received';
      const bPriority = getActiveStatus(b)?.status ?? 'received';
      const diff = STATUS_PRIORITY[aPriority] - STATUS_PRIORITY[bPriority];
      if (diff !== 0) return diff;
      return new Date(b.lastDeliveryDate ?? 0).getTime() - new Date(a.lastDeliveryDate ?? 0).getTime();
    });
  }, [filtered]);

  const pendingCount = useMemo(
    () => allProfiles.reduce((s, p) => s + p.pendingDeliveries, 0),
    [allProfiles],
  );

  const handleSearchToggle = useCallback(() => setSearchVisible((v) => !v), []);

  useEffect(() => {
    window.addEventListener('appshell:search', handleSearchToggle);
    return () => window.removeEventListener('appshell:search', handleSearchToggle);
  }, [handleSearchToggle]);

  const handleDelete = useCallback(async (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Видалити постачальника «${supplier.name}»?`)) return;
    await deleteSupplier.mutateAsync(supplier.documentId);
  }, [deleteSupplier]);

  const columns: Column<SupplierProfile>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Постачальник',
      render: (p) => {
        const active = getActiveStatus(p);
        return (
          <div className={styles.nameCell}>
            <div className={styles.supplierIcon}>
              <Icon name="truck" size="md" color="secondary" />
            </div>
            <div className={styles.nameInfo}>
              <Text variant="labelMedium" weight="semibold">{p.name}</Text>
              {p.supplier?.contactPerson && (
                <Text variant="bodySmall" color="tertiary">{p.supplier.contactPerson}</Text>
              )}
              {p.supplier?.category && !p.supplier?.contactPerson && (
                <Text variant="bodySmall" color="tertiary">{p.supplier.category}</Text>
              )}
              {active && (
                <Badge variant={STATUS_VARIANTS[active.status]} size="sm">
                  {STATUS_LABELS[active.status]}
                  {active.expectedAt && ` · ${formatDate(active.expectedAt)}`}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'contact',
      header: 'Контакт',
      width: '160px',
      hideOnMobile: true,
      render: (p) => {
        if (!p.supplier) return <Text variant="bodySmall" color="tertiary">—</Text>;
        const s = p.supplier;
        if (s.phone) return (
          <a
            href={`tel:${s.phone}`}
            className={styles.contactLink}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="phone" size="sm" color="tertiary" />
            <Text variant="bodySmall">{s.phone}</Text>
          </a>
        );
        if (s.telegram) return (
          <a
            href={s.telegram.startsWith('+') || /^\d/.test(s.telegram)
              ? `https://t.me/${s.telegram}`
              : `https://t.me/${s.telegram.replace(/^@/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="message-circle" size="sm" color="tertiary" />
            <Text variant="bodySmall">{s.telegram}</Text>
          </a>
        );
        return <Text variant="bodySmall" color="tertiary">—</Text>;
      },
    },
    {
      key: 'status',
      header: 'Статус',
      width: '140px',
      hideOnMobile: true,
      render: (p) => {
        const active = getActiveStatus(p);
        if (!active) return <Text variant="bodySmall" color="tertiary">—</Text>;
        return (
          <div className={styles.statusCell}>
            <Badge variant={STATUS_VARIANTS[active.status]} size="sm">
              {STATUS_LABELS[active.status]}
            </Badge>
            {active.expectedAt && (
              <Text variant="caption" color="tertiary">{formatDate(active.expectedAt)}</Text>
            )}
          </div>
        );
      },
    },
    {
      key: 'totalSpent',
      header: 'Витрачено',
      width: '120px',
      align: 'right',
      hideOnMobile: true,
      render: (p) => (
        <Text variant="labelSmall" weight="semibold" color="secondary">
          ₴{formatCurrency(p.totalSpent)}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (p) => {
        if (!p.supplier) return null;
        return (
          <div className={styles.rowActions}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={(e) => { e.stopPropagation(); setEditSupplier(p.supplier!); }}
              aria-label="Редагувати"
            >
              <Icon name="edit" size="sm" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={(e) => handleDelete(p.supplier!, e)}
              aria-label="Видалити"
              className={styles.deleteBtn}
            >
              <Icon name="trash" size="sm" />
            </Button>
          </div>
        );
      },
    },
  ], [handleDelete]);

  return (
    <div className={styles.page}>

      {/* Search bar */}
      {searchVisible && (
        <div className={styles.searchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук постачальника, контакту, категорії..."
            autoFocus
          />
          <Button variant="ghost" size="sm" iconOnly onClick={() => { setSearchVisible(false); setSearch(''); }} aria-label="Закрити пошук">
            <Icon name="close" size="sm" />
          </Button>
        </div>
      )}

      {/* Header row with Add button */}
      <div className={styles.headerRow}>
        {pendingCount > 0 ? (
          <div className={styles.statusBanner}>
            <Icon name="warning" size="sm" />
            <Text variant="bodySmall" weight="semibold">
              {pendingCount} {pendingCount === 1 ? 'поставка очікується' : 'поставки очікуються'}
            </Text>
          </div>
        ) : (
          <div />
        )}
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" size="sm" />
          Додати постачальника
        </Button>
      </div>

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
            description: search
              ? 'Спробуйте інший запит'
              : 'Натисніть «Додати постачальника» щоб почати',
          }}
          onRowClick={(p) => setSelectedProfile(p)}
        />
      )}

      {/* Supplier Detail Modal */}
      <SupplierDetailModal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        supplier={selectedProfile}
        onNewSupply={() => {}}
        onSupplierUpdated={() => refetchSuppliers()}
      />

      {/* Create Modal */}
      <SupplierFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetchSuppliers()}
      />

      {/* Edit Modal */}
      <SupplierFormModal
        isOpen={!!editSupplier}
        onClose={() => setEditSupplier(null)}
        supplier={editSupplier}
        onSuccess={() => { refetchSuppliers(); setEditSupplier(null); }}
      />
    </div>
  );
}
