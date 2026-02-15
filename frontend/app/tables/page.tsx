'use client';

/**
 * CoffeePOS - Tables Management Page
 *
 * Visual table management for cafes and restaurants
 * Includes CRUD operations: create, edit, delete tables
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Text, Button, Icon, Badge } from '@/components';
import { Modal } from '@/components/atoms';
import { CategoryTabs, type Category } from '@/components/molecules';
import { TableFormModal } from '@/components/organisms';
import { useTables, useActiveOrders, useDeleteTable } from '@/lib/hooks';
import type { CafeTable, Order } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { tableKeys } from '@/lib/hooks/useTables';
import styles from './page.module.css';

// ============================================
// TYPES
// ============================================

type TableStatus = 'free' | 'occupied' | 'waiting';

interface TableWithStatus {
  id: number;
  number: number;
  seats: number;
  zone?: string;
  isActive: boolean;
  sortOrder: number;
  status: TableStatus;
  orderTotal?: number;
  customerName?: string;
  occupiedSince?: Date;
}

// ============================================
// HELPERS
// ============================================

function deriveTableStatus(table: CafeTable, activeOrders: Order[]): TableWithStatus {
  const tableOrder = activeOrders.find(
    (order) => order.tableNumber === String(table.number)
  );

  if (tableOrder) {
    const status: TableStatus = tableOrder.status === 'ready' ? 'waiting' : 'occupied';
    return {
      id: table.id,
      number: table.number,
      seats: table.seats,
      zone: table.zone,
      isActive: table.isActive,
      sortOrder: table.sortOrder,
      status,
      orderTotal: tableOrder.total,
      customerName: tableOrder.customerName,
      occupiedSince: new Date(tableOrder.createdAt),
    };
  }

  return {
    id: table.id,
    number: table.number,
    seats: table.seats,
    zone: table.zone,
    isActive: table.isActive,
    sortOrder: table.sortOrder,
    status: 'free',
  };
}

function getStatusInfo(status: TableStatus) {
  switch (status) {
    case 'free':
      return { label: 'Вільний', color: 'success' as const, icon: 'check' as const };
    case 'occupied':
      return { label: 'Зайнятий', color: 'primary' as const, icon: 'user' as const };
    case 'waiting':
      return { label: 'Очікує оплати', color: 'warning' as const, icon: 'clock' as const };
  }
}

function formatDuration(start: Date): string {
  const diff = Math.floor((Date.now() - start.getTime()) / 60000);
  if (diff < 60) {
    return `${diff} хв`;
  }
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours} год ${minutes} хв`;
}

// ============================================
// COMPONENT
// ============================================

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(null);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'all'>('all');

  // CRUD state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CafeTable | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: tables, isLoading: tablesLoading } = useTables();
  const { data: activeOrders } = useActiveOrders();
  const deleteTable = useDeleteTable();

  // Merge static tables with dynamic order status
  const tablesWithStatus = useMemo((): TableWithStatus[] => {
    if (!tables) return [];
    return tables.map((table) => deriveTableStatus(table, activeOrders || []));
  }, [tables, activeOrders]);

  const filteredTables = filterStatus === 'all'
    ? tablesWithStatus
    : tablesWithStatus.filter((t) => t.status === filterStatus);

  // Filter categories with counts
  const filterCategories = useMemo((): Category[] => {
    const freeCount = tablesWithStatus.filter((t) => t.status === 'free').length;
    const occupiedCount = tablesWithStatus.filter((t) => t.status === 'occupied' || t.status === 'waiting').length;

    return [
      { id: 'free', name: 'Вільні', count: freeCount },
      { id: 'occupied', name: 'Зайняті', count: occupiedCount },
    ];
  }, [tablesWithStatus]);

  // CRUD handlers
  const handleCreateTable = useCallback(() => {
    setEditingTable(null);
    setFormOpen(true);
  }, []);

  // Listen for AppShell "Додати стіл" action button
  useEffect(() => {
    const handler = () => handleCreateTable();
    window.addEventListener('appshell:action', handler);
    return () => window.removeEventListener('appshell:action', handler);
  }, [handleCreateTable]);

  const handleEditTable = useCallback((tableWithStatus: TableWithStatus) => {
    // Build a CafeTable-like object from TableWithStatus for the form
    const cafeTable: CafeTable = {
      id: tableWithStatus.id,
      documentId: '',
      number: tableWithStatus.number,
      seats: tableWithStatus.seats,
      zone: tableWithStatus.zone,
      isActive: tableWithStatus.isActive,
      sortOrder: tableWithStatus.sortOrder,
      createdAt: '',
      updatedAt: '',
    };
    setEditingTable(cafeTable);
    setFormOpen(true);
    setSelectedTable(null);
  }, []);

  const handleDeleteTable = useCallback(async (id: number) => {
    try {
      await deleteTable.mutateAsync(id);
      setDeleteConfirmId(null);
      setSelectedTable(null);
    } catch {
      // Error handling is done by React Query
    }
  }, [deleteTable]);

  const handleFormSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: tableKeys.lists() });
  }, [queryClient]);

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <CategoryTabs
          categories={filterCategories}
          value={filterStatus === 'all' ? null : filterStatus}
          showAll={true}
          allLabel="Всі"
          onChange={(id) => setFilterStatus((id || 'all') as TableStatus | 'all')}
        />
      </div>

      {/* Tables Grid */}
      <div className={styles.tablesGrid}>
        {tablesLoading ? (
          <div className={styles.loadingState}>
            <Icon name="clock" size="2xl" color="tertiary" />
            <Text variant="bodyLarge" color="secondary">Завантаження...</Text>
          </div>
        ) : (
          filteredTables.map((table) => {
            const statusInfo = getStatusInfo(table.status);
            const isOccupied = table.status === 'occupied' || table.status === 'waiting';
            return (
              <div
                key={table.id}
                className={`${styles.tableCard} ${styles[table.status]} ${!table.isActive ? styles.inactive : ''} ${selectedTable?.id === table.id ? styles.selected : ''}`}
                onClick={() => setSelectedTable(table)}
              >
                {/* Header: number + zone + seats */}
                <div className={styles.tableHeader}>
                  <div className={styles.tableId}>
                    <Text variant="h4" weight="bold">#{table.number}</Text>
                    {table.zone && (
                      <Text variant="caption" color="tertiary">{table.zone}</Text>
                    )}
                  </div>
                  <div className={styles.tableSeats}>
                    <Icon name="users" size="xs" color="tertiary" />
                    <Text variant="labelSmall" color="tertiary">{table.seats}</Text>
                  </div>
                </div>

                {/* Status row */}
                <div className={styles.tableStatus}>
                  <div className={`${styles.statusDot} ${styles[table.status]}`} />
                  <Text variant="labelSmall" color="secondary">{statusInfo.label}</Text>
                  {!table.isActive && (
                    <Badge variant="warning" size="sm">Неактивний</Badge>
                  )}
                </div>

                {/* Footer: order info or actions */}
                <div className={styles.tableFooter}>
                  {isOccupied ? (
                    <div className={styles.orderInfo}>
                      <Text variant="h4" weight="bold" color="accent">
                        ₴{table.orderTotal}
                      </Text>
                      <div className={styles.orderMeta}>
                        {table.occupiedSince && (
                          <div className={styles.orderMetaItem}>
                            <Icon name="clock" size="xs" color="tertiary" />
                            <Text variant="caption" color="tertiary">
                              {formatDuration(table.occupiedSince)}
                            </Text>
                          </div>
                        )}
                        {table.customerName && (
                          <Text variant="caption" color="tertiary">{table.customerName}</Text>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.cardActions}>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={styles.quickAction}
                        onClick={(e) => { e.stopPropagation(); handleEditTable(table); }}
                      >
                        <Icon name="edit" size="xs" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={styles.quickAction}
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(table.id); }}
                      >
                        <Icon name="close" size="xs" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table Details Modal */}
      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `Стіл #${selectedTable.number}` : ''}
        subtitle={selectedTable ? `${selectedTable.seats} місць${selectedTable.zone ? ` \u2022 ${selectedTable.zone}` : ''}` : ''}
        icon="store"
        size="sm"
      >
        {selectedTable && (
          <div className={styles.modalContent}>
            {/* Info section with status */}
            <div className={styles.modalSection}>
              <div className={styles.modalRow}>
                <Text variant="labelMedium" color="secondary">Статус</Text>
                <Badge
                  variant={getStatusInfo(selectedTable.status).color}
                  size="sm"
                >
                  {getStatusInfo(selectedTable.status).label}
                </Badge>
              </div>

              {(selectedTable.status === 'occupied' || selectedTable.status === 'waiting') && (
                <>
                  <div className={styles.modalRow}>
                    <Text variant="labelMedium" color="secondary">Сума</Text>
                    <Text variant="labelLarge" weight="bold" color="accent">₴{selectedTable.orderTotal}</Text>
                  </div>
                  {selectedTable.customerName && (
                    <div className={styles.modalRow}>
                      <Text variant="labelMedium" color="secondary">Клієнт</Text>
                      <Text variant="bodyMedium">{selectedTable.customerName}</Text>
                    </div>
                  )}
                  {selectedTable.occupiedSince && (
                    <div className={styles.modalRow}>
                      <Text variant="labelMedium" color="secondary">Час</Text>
                      <Text variant="bodyMedium">{formatDuration(selectedTable.occupiedSince)}</Text>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className={styles.modalActions}>
              {(selectedTable.status === 'occupied' || selectedTable.status === 'waiting') && (
                <>
                  <div className={styles.modalActionsRow}>
                    <Button variant="success" size="lg" fullWidth>
                      <Icon name="cash" size="sm" />
                      Оплата
                    </Button>
                    <Link href="/pos" className={styles.fullWidth}>
                      <Button variant="secondary" size="lg" fullWidth>
                        <Icon name="edit" size="sm" />
                        Редагувати
                      </Button>
                    </Link>
                  </div>
                  <Button variant="ghost" size="sm" fullWidth>
                    <Icon name="printer" size="sm" />
                    Попередній рахунок
                  </Button>
                </>
              )}

              {selectedTable.status === 'free' && (
                <>
                  <Link href="/pos" className={styles.fullWidth}>
                    <Button variant="primary" size="lg" fullWidth>
                      <Icon name="plus" size="sm" />
                      Нове замовлення
                    </Button>
                  </Link>
                  <div className={styles.modalActionsRow}>
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={() => handleEditTable(selectedTable)}
                    >
                      <Icon name="edit" size="sm" />
                      Редагувати стіл
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      fullWidth
                      onClick={() => {
                        setSelectedTable(null);
                        setDeleteConfirmId(selectedTable.id);
                      }}
                    >
                      <Icon name="close" size="sm" />
                      Видалити
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Table Form Modal (Create / Edit) */}
      <TableFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTable(null);
        }}
        table={editingTable}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Видалити стіл?"
        description="Цю дію неможливо скасувати. Стіл буде видалено назавжди."
        icon="warning"
        variant="error"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setDeleteConfirmId(null)}
            >
              Скасувати
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={deleteTable.isPending}
              onClick={() => deleteConfirmId && handleDeleteTable(deleteConfirmId)}
            >
              <Icon name="close" size="sm" />
              Видалити
            </Button>
          </>
        }
      />
    </div>
  );
}
