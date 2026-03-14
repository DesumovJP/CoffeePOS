'use client';

/**
 * CoffeePOS - Поставки Page
 *
 * Two tabs:
 *  - "Замовлення" — build a draft order from ingredients and export as CSV
 *  - "Постачальники" — manage supplier entities
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Text, Button, Icon, Badge, Spinner } from '@/components/atoms';
import { SearchInput, SegmentedControl } from '@/components/molecules';
import {
  DataTable,
  SupplierDetailModal,
  SupplierFormModal,
  type Column,
  type SupplierProfile,
} from '@/components/organisms';
import {
  useSupplies,
  useSuppliers,
  useDeleteSupplier,
  useIngredients,
} from '@/lib/hooks';
import type { Supply, SupplyStatus, Supplier, Ingredient, IngredientUnit } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const TABS = [
  { id: 'order', label: 'Замовлення' },
  { id: 'suppliers', label: 'Постачальники' },
];

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

const STATUS_PRIORITY: Record<SupplyStatus, number> = {
  shipped: 0,
  ordered: 1,
  draft: 2,
  received: 3,
  cancelled: 4,
};

const UNIT_LABELS: Record<IngredientUnit, string> = {
  g: 'г',
  kg: 'кг',
  ml: 'мл',
  l: 'л',
  pcs: 'шт',
  portion: 'порц',
};

// ============================================
// HELPERS
// ============================================

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function buildProfiles(suppliers: Supplier[], supplies: Supply[]): SupplierProfile[] {
  const profiles: SupplierProfile[] = [];
  const handledNames = new Set<string>();

  for (const supplier of suppliers) {
    const name = supplier.name;
    handledNames.add(name.toLowerCase());
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

function getActiveStatus(profile: SupplierProfile): { status: SupplyStatus; expectedAt?: string } | null {
  const pending = profile.supplies.filter((s) => PENDING_STATUSES.has(s.status));
  if (pending.length === 0) return null;
  const sorted = [...pending].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
  return { status: sorted[0].status, expectedAt: sorted[0].expectedAt };
}

// ============================================
// ORDER LINE TYPE
// ============================================

interface OrderLine {
  key: string;
  ingredientDocumentId: string;
  name: string;
  unit: IngredientUnit;
  category: string;
  quantity: number;
  supplier: string;
  note: string;
}

// ============================================
// ORDER TAB
// ============================================

function OrderTab() {
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [search, setSearch] = useState('');

  const { data: ingredients = [], isLoading: loadingIng } = useIngredients({ pageSize: 200 });
  const { data: suppliers = [] } = useSuppliers();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category?.name?.toLowerCase().includes(q),
    );
  }, [ingredients, search]);

  // Grouped by category, sorted by category name
  const grouped = useMemo(() => {
    const map = new Map<string, Ingredient[]>();
    for (const ing of filtered) {
      const cat = ing.category?.name || 'Без категорії';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ing);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'uk'));
  }, [filtered]);

  const addLine = useCallback((ing: Ingredient) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.ingredientDocumentId === ing.documentId);
      if (existing) {
        return prev.map((l) =>
          l.ingredientDocumentId === ing.documentId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key: ing.documentId + '_' + Date.now(),
          ingredientDocumentId: ing.documentId,
          name: ing.name,
          unit: ing.unit,
          category: ing.category?.name || '',
          quantity: 1,
          supplier: ing.supplier || '',
          note: '',
        },
      ];
    });
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const updateLine = useCallback((key: string, updates: Partial<OrderLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...updates } : l)));
  }, []);

  const exportCSV = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const header = 'Назва,Одиниця,Кількість,Постачальник,Категорія,Примітка';
    const rows = lines.map((l) =>
      [l.name, UNIT_LABELS[l.unit] || l.unit, l.quantity, l.supplier, l.category, l.note]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header, ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zamovlennya_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [lines]);

  const pluralLines = (n: number) =>
    n === 1 ? '1 позиція' : n < 5 ? `${n} позиції` : `${n} позицій`;

  return (
    <div className={styles.orderTab}>
      {/* Tab header */}
      <div className={styles.orderTabHeader}>
        <Text variant="bodySmall" color="secondary">
          {lines.length > 0 ? pluralLines(lines.length) + ' у замовленні' : 'Замовлення порожнє'}
        </Text>
        <div className={styles.orderTabActions}>
          {lines.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setLines([])}>
              Очистити
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={exportCSV}
            disabled={lines.length === 0}
          >
            <Icon name="download" size="sm" />
            Експортувати CSV
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className={styles.orderLayout}>
        {/* Left: ingredient picker */}
        <div className={styles.pickerPanel}>
          <div className={styles.pickerSearch}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Пошук інгредієнту..."
            />
          </div>
          <div className={styles.pickerList}>
            {loadingIng ? (
              <div className={styles.pickerLoading}>
                <Spinner size="sm" />
              </div>
            ) : grouped.length === 0 ? (
              <div className={styles.pickerEmpty}>
                <Text variant="bodySmall" color="tertiary">Нічого не знайдено</Text>
              </div>
            ) : (
              grouped.map(([catName, ings]) => (
                <div key={catName} className={styles.pickerGroup}>
                  <Text variant="overline" color="tertiary" className={styles.pickerGroupLabel}>
                    {catName}
                  </Text>
                  {ings.map((ing) => {
                    const inOrder = lines.some((l) => l.ingredientDocumentId === ing.documentId);
                    return (
                      <button
                        key={ing.documentId}
                        className={`${styles.pickerItem} ${inOrder ? styles.pickerItemInOrder : ''}`}
                        onClick={() => addLine(ing)}
                        title={`Додати ${ing.name}`}
                      >
                        <div className={styles.pickerItemInfo}>
                          <Text variant="labelSmall" weight="semibold">{ing.name}</Text>
                          <Text variant="caption" color="tertiary">{UNIT_LABELS[ing.unit]}</Text>
                        </div>
                        <Icon
                          name={inOrder ? 'check' : 'plus'}
                          size="sm"
                          color={inOrder ? 'success' : 'tertiary'}
                        />
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: order lines */}
        <div className={styles.linesPanel}>
          {lines.length === 0 ? (
            <div className={styles.linesEmpty}>
              <Icon name="package" size="2xl" color="tertiary" />
              <Text variant="bodyMedium" color="tertiary">
                Натисніть «+» біля інгредієнта щоб додати до замовлення
              </Text>
            </div>
          ) : (
            <div className={styles.linesTable}>
              {/* Header */}
              <div className={styles.lineRow + ' ' + styles.lineHeader}>
                <span className={styles.colName}>Назва</span>
                <span className={styles.colQty}>Кількість</span>
                <span className={styles.colSupplier}>Постачальник</span>
                <span className={styles.colNote}>Примітка</span>
                <span className={styles.colRemove} />
              </div>
              {/* Lines */}
              {lines.map((line) => (
                <div key={line.key} className={styles.lineRow}>
                  <div className={styles.colName}>
                    <Text variant="bodySmall" weight="semibold">{line.name}</Text>
                    <Text variant="caption" color="tertiary">{line.category}</Text>
                  </div>
                  <div className={styles.colQty}>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.key, { quantity: parseFloat(e.target.value) || 0 })
                      }
                      className={styles.qtyInput}
                    />
                    <Text variant="caption" color="tertiary">{UNIT_LABELS[line.unit]}</Text>
                  </div>
                  <div className={styles.colSupplier}>
                    <select
                      value={line.supplier}
                      onChange={(e) => updateLine(line.key, { supplier: e.target.value })}
                      className={styles.supplierSelect}
                    >
                      <option value="">— Не вказано —</option>
                      {suppliers.map((s) => (
                        <option key={s.documentId} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.colNote}>
                    <input
                      type="text"
                      placeholder="Примітка..."
                      value={line.note}
                      onChange={(e) => updateLine(line.key, { note: e.target.value })}
                      className={styles.noteInput}
                    />
                  </div>
                  <button
                    className={styles.colRemove}
                    onClick={() => removeLine(line.key)}
                    aria-label="Видалити рядок"
                  >
                    <Icon name="close" size="sm" color="tertiary" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUPPLIERS TAB
// ============================================

function SuppliersTab() {
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SupplierProfile | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading: loadingSuppliers, refetch: refetchSuppliers } = useSuppliers();
  const { data: supplies = [], isLoading: loadingSupplies } = useSupplies({
    pageSize: 200,
    sort: 'createdAt:desc',
  });
  const deleteSupplier = useDeleteSupplier();

  const isLoading = loadingSuppliers || loadingSupplies;

  const allProfiles = useMemo(
    () => buildProfiles(suppliers, supplies),
    [suppliers, supplies],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProfiles;
    return allProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.supplier?.contactPerson?.toLowerCase().includes(q) ||
        p.supplier?.category?.toLowerCase().includes(q),
    );
  }, [allProfiles, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aPriority = getActiveStatus(a)?.status ?? 'received';
      const bPriority = getActiveStatus(b)?.status ?? 'received';
      const diff = STATUS_PRIORITY[aPriority] - STATUS_PRIORITY[bPriority];
      if (diff !== 0) return diff;
      return (
        new Date(b.lastDeliveryDate ?? 0).getTime() -
        new Date(a.lastDeliveryDate ?? 0).getTime()
      );
    });
  }, [filtered]);

  const handleSearchToggle = useCallback(() => setSearchVisible((v) => !v), []);
  const handleCreate = useCallback(() => setCreateOpen(true), []);

  useEffect(() => {
    window.addEventListener('appshell:search', handleSearchToggle);
    return () => window.removeEventListener('appshell:search', handleSearchToggle);
  }, [handleSearchToggle]);

  useEffect(() => {
    window.addEventListener('appshell:action', handleCreate);
    return () => window.removeEventListener('appshell:action', handleCreate);
  }, [handleCreate]);

  const handleDelete = useCallback(
    async (supplier: Supplier, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(`Видалити постачальника «${supplier.name}»?`)) return;
      await deleteSupplier.mutateAsync(supplier.documentId);
    },
    [deleteSupplier],
  );

  const columns: Column<SupplierProfile>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Постачальник',
        render: (p) => (
          <div className={styles.nameCell}>
            <div className={styles.supplierAvatar}>
              <Icon name="truck" size="sm" color="secondary" />
            </div>
            <div className={styles.nameInfo}>
              <Text variant="labelMedium" weight="semibold">{p.name}</Text>
              {p.supplier?.contactPerson && (
                <Text variant="bodySmall" color="tertiary">{p.supplier.contactPerson}</Text>
              )}
              {p.supplier?.category && !p.supplier?.contactPerson && (
                <Text variant="bodySmall" color="tertiary">{p.supplier.category}</Text>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Контакт',
        width: '160px',
        hideOnMobile: true,
        render: (p) => {
          if (!p.supplier) return <Text variant="bodySmall" color="tertiary">—</Text>;
          const s = p.supplier;
          if (s.phone)
            return (
              <a
                href={`tel:${s.phone}`}
                className={styles.contactLink}
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="phone" size="sm" color="tertiary" />
                <Text variant="bodySmall">{s.phone}</Text>
              </a>
            );
          if (s.telegram)
            return (
              <a
                href={
                  s.telegram.startsWith('+') || /^\d/.test(s.telegram)
                    ? `https://t.me/${s.telegram}`
                    : `https://t.me/${s.telegram.replace(/^@/, '')}`
                }
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
                onClick={(e) => {
                  e.stopPropagation();
                  setEditSupplier(p.supplier!);
                }}
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
    ],
    [handleDelete],
  );

  return (
    <>
      {searchVisible && (
        <div className={styles.searchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук постачальника, контакту, категорії..."
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => {
              setSearchVisible(false);
              setSearch('');
            }}
            aria-label="Закрити пошук"
          >
            <Icon name="close" size="sm" />
          </Button>
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingState}>
          <Spinner size="lg" />
          <Text variant="bodyMedium" color="secondary">Завантаження постачальників...</Text>
        </div>
      )}

      {!isLoading && (
        <DataTable
          columns={columns}
          data={sorted}
          getRowKey={(p) => p.name}
          emptyState={{
            icon: 'truck',
            title: search ? 'Постачальників не знайдено' : 'Постачальників ще немає',
            description: search
              ? 'Спробуйте інший запит'
              : 'Натисніть «Додати постачальника» щоб почати',
          }}
          onRowClick={(p) => setSelectedProfile(p)}
        />
      )}

      <SupplierDetailModal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        supplier={selectedProfile}
        onNewSupply={() => {}}
        onSupplierUpdated={() => refetchSuppliers()}
      />

      <SupplierFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetchSuppliers()}
      />

      <SupplierFormModal
        isOpen={!!editSupplier}
        onClose={() => setEditSupplier(null)}
        supplier={editSupplier}
        onSuccess={() => {
          refetchSuppliers();
          setEditSupplier(null);
        }}
      />
    </>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState('order');

  return (
    <div className={styles.page}>
      <SegmentedControl
        options={TABS}
        value={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'order' ? <OrderTab /> : <SuppliersTab />}
    </div>
  );
}
