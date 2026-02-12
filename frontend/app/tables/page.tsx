'use client';

/**
 * ParadisePOS - Tables Management Page
 *
 * Visual table management for cafes and restaurants
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Text, Button, Icon, Badge } from '@/components';
import { Modal } from '@/components/atoms';
import { CategoryTabs, type Category } from '@/components/molecules';
import { useTables, useActiveOrders } from '@/lib/hooks';
import type { CafeTable, Order } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// TYPES
// ============================================

type TableStatus = 'free' | 'occupied' | 'waiting';

interface TableWithStatus {
  id: number;
  number: number;
  seats: number;
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

  const { data: tables, isLoading: tablesLoading } = useTables({ isActive: true });
  const { data: activeOrders } = useActiveOrders();

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
            return (
              <div
                key={table.id}
                className={`${styles.tableCard} ${styles[table.status]} ${selectedTable?.id === table.id ? styles.selected : ''}`}
                onClick={() => setSelectedTable(table)}
              >
                <div className={styles.tableHeader}>
                  <Text variant="h4" weight="bold">#{table.number}</Text>
                  <div className={styles.tableSeats}>
                    <Icon name="users" size="xs" color="tertiary" />
                    <Text variant="caption" color="tertiary">{table.seats}</Text>
                  </div>
                </div>

                <div className={styles.tableStatus}>
                  <div className={`${styles.statusDot} ${styles[table.status]}`} />
                  <Text variant="labelSmall" color="secondary">{statusInfo.label}</Text>
                </div>

                {table.status === 'occupied' || table.status === 'waiting' ? (
                  <div className={styles.tableInfo}>
                    {table.customerName && (
                      <Text variant="caption" color="tertiary">{table.customerName}</Text>
                    )}
                    <Text variant="labelLarge" weight="semibold" color="accent">
                      ₴{table.orderTotal}
                    </Text>
                    {table.occupiedSince && (
                      <Text variant="caption" color="tertiary">
                        {formatDuration(table.occupiedSince)}
                      </Text>
                    )}
                  </div>
                ) : (
                  <div className={styles.tableInfo}>
                    <Button variant="ghost" size="xs" className={styles.quickAction}>
                      <Icon name="plus" size="xs" />
                      Нове замовлення
                    </Button>
                  </div>
                )}
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
        subtitle={selectedTable ? `${selectedTable.seats} місць` : ''}
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
                <Link href="/pos" className={styles.fullWidth}>
                  <Button variant="primary" size="lg" fullWidth>
                    <Icon name="plus" size="sm" />
                    Нове замовлення
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
