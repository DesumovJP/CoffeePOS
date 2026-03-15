'use client';

/**
 * CoffeePOS - Поставки Page
 *
 * Two tabs:
 *  - "Замовлення" — build a draft order from ingredients and export as CSV
 *  - "Постачальники" — manage supplier entities
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Text, Button, Icon, Badge, Spinner } from '@/components/atoms';
import { SearchInput, SegmentedControl, QuantityControl } from '@/components/molecules';
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
  useProducts,
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
// UNIFIED PICKER ITEM
// ============================================

// Unified item for the picker (can be ingredient or ready-made product)
interface PickerItem {
  documentId: string;  // prefixed 'prod:' for products to avoid collisions
  rawDocumentId: string; // original documentId without prefix
  name: string;
  unit: IngredientUnit;
  category: string;
  supplier: string; // empty string for products (no supplier field)
  imageUrl?: string;
  costPerUnit: number;
  kind: 'ingredient' | 'product';
}

// ============================================
// ORDER LINE TYPE
// ============================================

interface OrderLine {
  key: string;
  ingredientDocumentId: string;
  kind: 'ingredient' | 'product';
  name: string;
  unit: IngredientUnit;
  category: string;
  quantity: number;
  supplier: string;
  note: string;
  imageUrl?: string;
  costPerUnit: number;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatInvoiceTime(date: Date): string {
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// ORDER TAB — REDESIGNED
// ============================================

function OrderTab() {
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null); // null = all
  const [search, setSearch] = useState('');
  const [invoiceCreatedAt, setInvoiceCreatedAt] = useState<Date | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const { data: ingredients = [], isLoading: loadingIng } = useIngredients({ pageSize: 200 });
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  // Same params as POS/other pages → shared React Query cache → instant on revisit.
  // Filter recipes client-side: undefined/null/'none'/'simple' all pass through safely.
  const { data: allProducts = [], isLoading: loadingProducts } = useProducts({ pageSize: 200 });
  const readyProducts = useMemo(
    () => allProducts.filter((p) => p.inventoryType !== 'recipe'),
    [allProducts],
  );

  // Keep separate loading flags so chips and picker can appear independently
  const isPickerLoading = loadingIng || loadingProducts;

  // Track invoice creation time
  useEffect(() => {
    if (lines.length > 0 && invoiceCreatedAt === null) {
      setInvoiceCreatedAt(new Date());
    } else if (lines.length === 0 && invoiceCreatedAt !== null) {
      setInvoiceCreatedAt(null);
    }
  }, [lines.length, invoiceCreatedAt]);

  // Active supplier entity (for invoice header)
  const activeSupplierEntity = useMemo(
    () =>
      activeSupplier
        ? (suppliers.find((s) => s.name.toLowerCase() === activeSupplier.toLowerCase()) ?? null)
        : null,
    [activeSupplier, suppliers],
  );

  // Invoice number derived from creation time
  const invoiceNumber = useMemo(() => {
    if (!invoiceCreatedAt) return '';
    const d = invoiceCreatedAt;
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
    const hhmm = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    return `#${ymd}-${hhmm}`;
  }, [invoiceCreatedAt]);

  // Approximate total amount
  const totalAmount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.costPerUnit, 0),
    [lines],
  );

  // Build unique supplier list from ingredient supplier strings
  const availableSuppliers = useMemo(() => {
    const map = new Map<string, number>(); // name (lower) → ingredient count
    for (const ing of ingredients) {
      if (!ing.supplier) continue;
      ing.supplier.split(',').forEach((part) => {
        const name = part.trim();
        if (!name) return;
        const key = name.toLowerCase();
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    }
    const entityByLower = new Map(suppliers.map((s) => [s.name.toLowerCase(), s.name]));
    return [...map.entries()]
      .map(([lower, count]) => ({
        name: entityByLower.get(lower) ?? lower.replace(/^\w/, (c) => c.toUpperCase()),
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  }, [ingredients, suppliers]);

  // How many lines in cart belong to each supplier
  const linesBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) {
      const key = line.supplier.toLowerCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [lines]);

  // Convert ingredients to unified PickerItem format
  const ingredientItems = useMemo((): PickerItem[] =>
    ingredients.map((ing) => ({
      documentId: ing.documentId,
      rawDocumentId: ing.documentId,
      name: ing.name,
      unit: ing.unit,
      category: ing.category?.name || 'Без категорії',
      supplier: ing.supplier || '',
      imageUrl: ing.image?.formats?.thumbnail?.url || ing.image?.url,
      costPerUnit: ing.costPerUnit,
      kind: 'ingredient' as const,
    })),
    [ingredients],
  );

  // Convert ready products to unified PickerItem format (prefixed to avoid id collisions)
  const productItems = useMemo((): PickerItem[] =>
    readyProducts.map((p) => ({
      documentId: 'prod:' + p.documentId,
      rawDocumentId: p.documentId,
      name: p.name,
      unit: 'pcs' as IngredientUnit,
      category: p.category?.name || 'Готові товари',
      supplier: '',
      imageUrl: p.image?.formats?.thumbnail?.url || p.image?.url,
      costPerUnit: p.costPrice || 0,
      kind: 'product' as const,
    })),
    [readyProducts],
  );

  // Filtered items by active supplier + search
  const filteredItems = useMemo(() => {
    const ingList = activeSupplier
      ? ingredientItems.filter((i) => i.supplier.toLowerCase().includes(activeSupplier.toLowerCase()))
      : ingredientItems;

    // Products always show (no supplier filtering) unless there's a text search
    const allItems = [...ingList, ...productItems];
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
    );
  }, [ingredientItems, productItems, activeSupplier, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PickerItem[]>();
    for (const item of filteredItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'uk'));
  }, [filteredItems]);

  // Get quantity in cart for a picker item (ingredient or product)
  const getLineQty = useCallback(
    (itemDocumentId: string) => {
      const line = lines.find((l) => l.ingredientDocumentId === itemDocumentId);
      return line ? line.quantity : 0;
    },
    [lines],
  );

  const setLineQty = useCallback(
    (item: PickerItem, qty: number) => {
      if (qty <= 0) {
        setLines((prev) => {
          const next = prev.filter((l) => l.ingredientDocumentId !== item.documentId);
          if (next.length === 0) setActiveSupplier(null);
          return next;
        });
        return;
      }
      const isNewLine = !lines.some((l) => l.ingredientDocumentId === item.documentId);

      // Auto-select supplier when on "Всі" and adding a new ingredient item.
      // Use the canonical name from availableSuppliers if found (suppliers already loaded),
      // otherwise fall back to the raw ingredient supplier string. Chip comparison is
      // case-insensitive, so even a stale fallback name will correctly highlight the chip.
      if (isNewLine && activeSupplier === null && item.kind === 'ingredient' && item.supplier) {
        const firstRaw = item.supplier.split(',')[0].trim();
        const match = availableSuppliers.find((s) => s.name.toLowerCase() === firstRaw.toLowerCase());
        setActiveSupplier(match?.name ?? firstRaw);
      }

      setLines((prev) => {
        const existing = prev.find((l) => l.ingredientDocumentId === item.documentId);
        if (existing) {
          return prev.map((l) =>
            l.ingredientDocumentId === item.documentId ? { ...l, quantity: qty } : l,
          );
        }
        return [
          ...prev,
          {
            key: item.documentId + '_' + Date.now(),
            ingredientDocumentId: item.documentId,
            kind: item.kind,
            name: item.name,
            unit: item.unit,
            category: item.category,
            quantity: qty,
            supplier: activeSupplier || item.supplier || '',
            note: '',
            imageUrl: item.imageUrl,
            costPerUnit: item.costPerUnit,
          },
        ];
      });
    },
    [activeSupplier, availableSuppliers, lines],
  );

  const removeLine = useCallback((key: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.key !== key);
      if (next.length === 0) setActiveSupplier(null);
      return next;
    });
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
      {/* ── Top bar: supplier chips only ── */}
      <div className={styles.supplierChipsWrap} ref={chipsRef}>
        {loadingSuppliers ? (
          <div className={styles.chipsLoading}><Spinner size="sm" /></div>
        ) : (
          <>
            <button
              className={`${styles.supplierChip} ${activeSupplier === null ? styles.supplierChipActive : ''}`}
              onClick={() => setActiveSupplier(null)}
            >
              Всі
            </button>
            {availableSuppliers.map((s) => {
              const cartCount = linesBySupplier.get(s.name.toLowerCase()) ?? 0;
              const isActive = activeSupplier?.toLowerCase() === s.name.toLowerCase();
              return (
                <button
                  key={s.name}
                  className={`${styles.supplierChip} ${isActive ? styles.supplierChipActive : ''} ${cartCount > 0 ? styles.supplierChipHasItems : ''}`}
                  onClick={() => setActiveSupplier(isActive ? null : s.name)}
                >
                  {s.name}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* ── Split layout ── */}
      <div className={styles.orderLayout}>

        {/* Left: ingredient picker with inline search */}
        <div className={styles.pickerPanel}>
          <div className={styles.pickerSearchWrap}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Пошук товару..."
            />
          </div>
          <div className={styles.pickerList}>
            {isPickerLoading ? (
              <div className={styles.pickerLoading}><Spinner size="sm" /></div>
            ) : grouped.length === 0 ? (
              <div className={styles.pickerEmpty}>
                <Icon name={search ? 'search' : 'package'} size="xl" color="tertiary" />
                <Text variant="bodySmall" color="tertiary">
                  {search ? 'Нічого не знайдено' : 'Немає товарів'}
                </Text>
                {search && (
                  <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
                    Скинути пошук
                  </Button>
                )}
              </div>
            ) : (
              grouped.map(([catName, items]) => (
                <div key={catName} className={styles.pickerGroup}>
                  <Text variant="overline" color="tertiary" className={styles.pickerGroupLabel}>
                    {catName}
                  </Text>
                  {items.map((item) => {
                    const qty = getLineQty(item.documentId);
                    const inCart = qty > 0;
                    return (
                      <div
                        key={item.documentId}
                        className={`${styles.pickerItem} ${inCart ? styles.pickerItemInOrder : ''}`}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className={styles.pickerItemThumb}
                          />
                        ) : (
                          <div className={styles.pickerItemThumbPlaceholder}>
                            <Icon name="package" size="xs" color="tertiary" />
                          </div>
                        )}
                        <div className={styles.pickerItemInfo}>
                          <Text variant="labelSmall" weight="semibold">{item.name}</Text>
                          <Text variant="caption" color="tertiary">
                            {UNIT_LABELS[item.unit]}{item.costPerUnit > 0 ? ` · ₴${item.costPerUnit}` : ''}
                          </Text>
                        </div>
                        <div className={styles.pickerItemControl}>
                          {inCart ? (
                            <QuantityControl
                              value={qty}
                              min={1}
                              step={1}
                              size="sm"
                              onChange={(v) => setLineQty(item, v)}
                            />
                          ) : (
                            <button
                              className={styles.addBtn}
                              onClick={() => setLineQty(item, 1)}
                              aria-label={`Додати ${item.name}`}
                            >
                              <Icon name="plus" size="xs" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: invoice preview */}
        <div className={styles.linesPanel}>
          {lines.length === 0 ? (
            <div className={styles.linesEmpty}>
              <div className={styles.linesEmptyIcon}>
                <Icon name="package" size="2xl" color="tertiary" />
              </div>
              <Text variant="bodyMedium" weight="semibold" color="secondary">
                Накладна порожня
              </Text>
              <Text variant="bodySmall" color="tertiary">
                Натисніть «+» біля товару зліва щоб додати
              </Text>
            </div>
          ) : (
            <div className={styles.invoiceDoc}>

              {/* ── Invoice header: supplier info + meta ── */}
              <div className={styles.invoiceHeader}>
                <div className={styles.invoiceSupplierRow}>
                  <div className={styles.supplierInitialsAvatar}>
                    {activeSupplier
                      ? getInitials(activeSupplier)
                      : <Icon name="truck" size="sm" color="secondary" />}
                  </div>
                  <div className={styles.invoiceSupplierText}>
                    <Text variant="labelMedium" weight="bold">
                      {activeSupplier || 'Замовлення'}
                    </Text>
                    {activeSupplierEntity?.address && (
                      <Text variant="caption" color="tertiary">
                        {activeSupplierEntity.address}
                      </Text>
                    )}
                    {(activeSupplierEntity?.phone || activeSupplierEntity?.telegram) && (
                      <Text variant="caption" color="tertiary">
                        {activeSupplierEntity.phone || activeSupplierEntity.telegram}
                      </Text>
                    )}
                    {activeSupplierEntity?.contactPerson && (
                      <Text variant="caption" color="tertiary">
                        {activeSupplierEntity.contactPerson}
                      </Text>
                    )}
                  </div>
                </div>
                <div className={styles.invoiceMeta}>
                  <Text variant="overline" color="tertiary">НАКЛАДНА</Text>
                  <Text variant="labelSmall" weight="semibold">{invoiceNumber}</Text>
                  {invoiceCreatedAt && (
                    <>
                      <Text variant="caption" color="tertiary">
                        {formatInvoiceDate(invoiceCreatedAt)}
                      </Text>
                      <Text variant="caption" color="tertiary">
                        {formatInvoiceTime(invoiceCreatedAt)}
                      </Text>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.invoiceDivider} />

              {/* ── Invoice lines ── */}
              <div className={styles.invoiceBody}>
                {lines.map((line) => (
                  <div key={line.key} className={styles.invoiceLine}>
                    {line.imageUrl ? (
                      <img
                        src={line.imageUrl}
                        alt={line.name}
                        className={styles.invoiceLineThumb}
                      />
                    ) : (
                      <div className={styles.invoiceLineThumbPlaceholder}>
                        <Icon name="package" size="xs" color="tertiary" />
                      </div>
                    )}
                    <div className={styles.invoiceLineName}>
                      <Text variant="bodySmall" weight="semibold">{line.name}</Text>
                      {line.costPerUnit > 0 && (
                        <Text variant="caption" color="tertiary">
                          ₴{line.costPerUnit}/{UNIT_LABELS[line.unit]}
                        </Text>
                      )}
                    </div>
                    <div className={styles.invoiceLineQty}>
                      <QuantityControl
                        value={line.quantity}
                        min={1}
                        step={1}
                        size="sm"
                        onChange={(v) => updateLine(line.key, { quantity: v })}
                      />
                    </div>
                    {line.costPerUnit > 0 && (
                      <div className={styles.invoiceLineTotal}>
                        <Text variant="labelSmall" weight="semibold">
                          ₴{formatCurrency(line.quantity * line.costPerUnit)}
                        </Text>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Примітка..."
                      value={line.note}
                      onChange={(e) => updateLine(line.key, { note: e.target.value })}
                      className={`${styles.noteInput} ${styles.invoiceLineNote}`}
                    />
                    <button
                      className={styles.invoiceLineRemove}
                      onClick={() => removeLine(line.key)}
                      aria-label="Видалити рядок"
                    >
                      <Icon name="close" size="sm" color="tertiary" />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.invoiceDivider} />

              {/* ── Invoice footer ── */}
              <div className={styles.invoiceFooter}>
                <div className={styles.invoiceTotal}>
                  <Text variant="labelSmall" color="secondary" weight="semibold">
                    {pluralLines(lines.length)} у замовленні
                  </Text>
                  {totalAmount > 0 && (
                    <Text variant="labelMedium" weight="bold">
                      ≈ ₴{formatCurrency(totalAmount)}
                    </Text>
                  )}
                </div>
                <div className={styles.linesFooterActions}>
                  <Button variant="ghost" size="sm" onClick={() => { setLines([]); setActiveSupplier(null); }}>
                    Очистити
                  </Button>
                  <Button variant="primary" size="sm" onClick={exportCSV}>
                    <Icon name="download" size="sm" />
                    Експортувати CSV
                  </Button>
                </div>
              </div>

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
  const { data: ingredients = [] } = useIngredients({ pageSize: 200 });
  const deleteSupplier = useDeleteSupplier();

  const isLoading = loadingSuppliers || loadingSupplies;

  const allProfiles = useMemo(() => {
    const profiles = buildProfiles(suppliers, supplies);
    return profiles.map((p) => ({
      ...p,
      ingredientCount: ingredients.filter(
        (i) => i.supplier?.toLowerCase().includes(p.name.toLowerCase()),
      ).length,
    }));
  }, [suppliers, supplies, ingredients]);

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
        key: 'ingredientCount',
        header: 'Товарів',
        width: '80px',
        align: 'right',
        hideOnMobile: true,
        render: (p) => (
          <Text variant="bodySmall" color="secondary">
            {p.ingredientCount ?? 0}
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
