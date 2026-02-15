'use client';

/**
 * CoffeePOS - Profile Page
 *
 * Personal info + shift schedule with hours calculation
 */

import { useState, useMemo } from 'react';
import { Text, Avatar, Badge, GlassCard } from '@/components/atoms';
import { CategoryTabs, StatsGrid, type StatItem } from '@/components/molecules';
import { DataTable, type Column } from '@/components/organisms';
import { useShifts } from '@/lib/hooks';
import type { Shift } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const user = {
  name: 'Олена Коваленко',
  role: 'Бариста',
  email: 'olena.kovalenko@paradise.cafe',
  phone: '+380 67 123 4567',
  startDate: '2024-09-15',
};

const TABS = [
  { id: 'personal', name: 'Особисті дані' },
  { id: 'shifts', name: 'Графік змін' },
];

// ============================================
// HELPERS
// ============================================

function calculateDuration(openedAt: string, closedAt?: string): string {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getDurationHours(openedAt: string, closedAt?: string): number {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  return (end - start) / (1000 * 60 * 60);
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  return date >= weekStart;
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function daysSince(dateStr: string): number {
  const start = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

// ============================================
// PERSONAL INFO TAB
// ============================================

function PersonalInfoTab() {
  return (
    <GlassCard className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <Avatar fallback={user.name} size="xl" status="online" />
        <div className={styles.profileName}>
          <Text variant="h4" weight="bold">{user.name}</Text>
          <Badge variant="info" size="md">{user.role}</Badge>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Email</Text>
          <Text variant="bodyMedium" weight="medium">{user.email}</Text>
        </div>
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Телефон</Text>
          <Text variant="bodyMedium" weight="medium">{user.phone}</Text>
        </div>
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Дата початку роботи</Text>
          <Text variant="bodyMedium" weight="medium">
            {new Date(user.startDate).toLocaleDateString('uk-UA')}
          </Text>
        </div>
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Днів роботи</Text>
          <Text variant="bodyMedium" weight="medium">{daysSince(user.startDate)}</Text>
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================
// SHIFTS TAB
// ============================================

function ShiftsTab() {
  const { data: allShifts, isLoading } = useShifts();

  const myShifts = useMemo(() => {
    if (!allShifts) return [];
    return allShifts.filter((s) => s.openedBy === user.name);
  }, [allShifts]);

  const stats: StatItem[] = useMemo(() => {
    const weekShifts = myShifts.filter((s) => isThisWeek(s.openedAt));
    const monthShifts = myShifts.filter((s) => isThisMonth(s.openedAt));

    const weekHours = weekShifts.reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0);
    const monthHours = monthShifts.reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0);

    const closedShifts = myShifts.filter((s) => s.status === 'closed');
    const avgHours = closedShifts.length > 0
      ? closedShifts.reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0) / closedShifts.length
      : 0;

    return [
      { id: 'weekHours', label: 'Годин цього тижня', value: weekHours.toFixed(1), icon: 'clock' as const, iconColor: 'accent' as const },
      { id: 'monthHours', label: 'Годин цього місяця', value: monthHours.toFixed(1), icon: 'calendar' as const, iconColor: 'success' as const },
      { id: 'avgShift', label: 'Середня зміна', value: `${avgHours.toFixed(1)} год`, icon: 'chart' as const, iconColor: 'info' as const },
      { id: 'totalShifts', label: 'Всього змін', value: myShifts.length, icon: 'receipt' as const, iconColor: 'warning' as const },
    ];
  }, [myShifts]);

  const columns: Column<Shift>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Дата',
      width: '110px',
      render: (shift) => (
        <Text variant="bodyMedium" weight="medium">
          {new Date(shift.openedAt).toLocaleDateString('uk-UA')}
        </Text>
      ),
    },
    {
      key: 'time',
      header: 'Час',
      render: (shift) => (
        <Text variant="bodySmall" color="secondary">
          {new Date(shift.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          {' — '}
          {shift.closedAt
            ? new Date(shift.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
            : 'зараз'
          }
        </Text>
      ),
    },
    {
      key: 'duration',
      header: 'Тривалість',
      width: '100px',
      render: (shift) => (
        <Text variant="labelMedium" weight="semibold">
          {calculateDuration(shift.openedAt, shift.closedAt)}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: '100px',
      render: (shift) => (
        <Badge variant={shift.status === 'open' ? 'success' : 'default'} size="sm">
          {shift.status === 'open' ? 'Активна' : 'Закрита'}
        </Badge>
      ),
    },
    {
      key: 'orders',
      header: 'Замовлень',
      width: '100px',
      hideOnMobile: true,
      align: 'right',
      render: (shift) => (
        <Text variant="bodySmall" color="secondary">{shift.ordersCount}</Text>
      ),
    },
    {
      key: 'sales',
      header: 'Продажі',
      width: '100px',
      align: 'right',
      render: (shift) => (
        <Text variant="labelMedium" weight="semibold">₴{(shift.totalSales || 0).toFixed(0)}</Text>
      ),
    },
  ], []);

  return (
    <div className={styles.shiftsContent}>
      <StatsGrid stats={stats} columns={4} variant="bar" />
      <DataTable
        columns={columns}
        data={myShifts}
        getRowKey={(shift) => String(shift.id)}
        loading={isLoading}
        emptyState={{
          icon: 'clock',
          title: 'Змін не знайдено',
        }}
      />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string | null>('personal');

  return (
    <div className={styles.page}>
      <CategoryTabs
        categories={TABS}
        value={activeTab}
        showAll={false}
        onChange={setActiveTab}
      />

      {activeTab === 'personal' && <PersonalInfoTab />}
      {activeTab === 'shifts' && <ShiftsTab />}
    </div>
  );
}
