'use client';

/**
 * CoffeePOS - Profile Page
 *
 * Data-driven personal profile with 3 tabs:
 * - Особисті дані (personal info from Employee record)
 * - Мої зміни (shifts + hours chart)
 * - Моя статистика (sales + orders charts)
 */

import { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Text, Avatar, Badge, GlassCard, Spinner } from '@/components/atoms';
import { CategoryTabs, StatsGrid, type StatItem } from '@/components/molecules';
import { DataTable, type Column } from '@/components/organisms';
import { useEmployees, useEmployeeStats, useShifts } from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import type { Shift } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const TABS = [
  { id: 'personal', name: 'Особисті дані' },
  { id: 'shifts', name: 'Мої зміни' },
  { id: 'stats', name: 'Моя статистика' },
];

const ROLE_LABELS: Record<string, string> = {
  owner: 'Власник',
  manager: 'Менеджер',
  barista: 'Бариста',
};

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

function PersonalInfoTab({ employee }: { employee: any }) {
  return (
    <GlassCard className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <Avatar fallback={employee.name} size="xl" status={employee.isActive ? 'online' : 'offline'} />
        <div className={styles.profileName}>
          <Text variant="h4" weight="bold">{employee.name}</Text>
          <Badge variant="info" size="md">
            {employee.position || ROLE_LABELS[employee.role] || employee.role}
          </Badge>
        </div>
      </div>

      <div className={styles.infoGrid}>
        {employee.email && (
          <div className={styles.infoField}>
            <Text variant="caption" color="tertiary">Email</Text>
            <Text variant="bodyMedium" weight="medium">{employee.email}</Text>
          </div>
        )}
        {employee.phone && (
          <div className={styles.infoField}>
            <Text variant="caption" color="tertiary">Телефон</Text>
            <Text variant="bodyMedium" weight="medium">{employee.phone}</Text>
          </div>
        )}
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Роль</Text>
          <Text variant="bodyMedium" weight="medium">{ROLE_LABELS[employee.role] || employee.role}</Text>
        </div>
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Дата початку роботи</Text>
          <Text variant="bodyMedium" weight="medium">
            {new Date(employee.hireDate).toLocaleDateString('uk-UA')}
          </Text>
        </div>
        <div className={styles.infoField}>
          <Text variant="caption" color="tertiary">Днів роботи</Text>
          <Text variant="bodyMedium" weight="medium">{daysSince(employee.hireDate)}</Text>
        </div>
        {employee.position && (
          <div className={styles.infoField}>
            <Text variant="caption" color="tertiary">Посада</Text>
            <Text variant="bodyMedium" weight="medium">{employee.position}</Text>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ============================================
// SHIFTS TAB
// ============================================

function ShiftsTab({ employeeName, employeeId }: { employeeName: string; employeeId: string }) {
  const { data: allShifts, isLoading: shiftsLoading } = useShifts();
  const { data: empStats } = useEmployeeStats(employeeId);

  const [chartColors, setChartColors] = useState({
    info: '#007AFF',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setChartColors({
      info: get('--color-info') || '#007AFF',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
    });
  }, []);

  const myShifts = useMemo(() => {
    if (!allShifts) return [];
    return allShifts.filter((s) => s.openedBy === employeeName);
  }, [allShifts, employeeName]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <Text variant="labelSmall" color="tertiary">{label}</Text>
          <Text variant="labelMedium" weight="bold">{payload[0].value}</Text>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.tabContent}>
      <StatsGrid stats={stats} columns={4} variant="bar" />

      {/* Hours chart */}
      {empStats && (
        <div className={styles.chartSection}>
          <Text variant="labelMedium" weight="semibold" color="secondary">Години за 7 днів</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={empStats.dailyHours} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.textSecondary }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill={chartColors.info} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={myShifts}
        getRowKey={(shift) => String(shift.id)}
        loading={shiftsLoading}
        emptyState={{
          icon: 'clock',
          title: 'Змін не знайдено',
        }}
      />
    </div>
  );
}

// ============================================
// STATS TAB
// ============================================

function StatsTab({ employeeId }: { employeeId: string }) {
  const { data: empStats, isLoading } = useEmployeeStats(employeeId);

  const [chartColors, setChartColors] = useState({
    accent: '#3D3D3D',
    info: '#007AFF',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setChartColors({
      accent: get('--color-accent-600') || '#3D3D3D',
      info: get('--color-info') || '#007AFF',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
    });
  }, []);

  const stats: StatItem[] = useMemo(() => {
    if (!empStats) return [];
    return [
      { id: 'orders', label: 'Замовлень', value: empStats.totalOrders, icon: 'receipt' as const, iconColor: 'accent' as const },
      { id: 'sales', label: 'Продажі', value: `₴${empStats.totalSales.toLocaleString('uk-UA')}`, icon: 'cash' as const, iconColor: 'success' as const },
      { id: 'avg', label: 'Середній чек', value: `₴${empStats.avgOrderValue}`, icon: 'chart' as const, iconColor: 'info' as const },
      { id: 'hours', label: 'Годин', value: empStats.totalHours, icon: 'clock' as const, iconColor: 'warning' as const },
    ];
  }, [empStats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <Text variant="labelSmall" color="tertiary">{label}</Text>
          <Text variant="labelMedium" weight="bold">{payload[0].value}</Text>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className={styles.loading}><Spinner size="md" /></div>;
  }

  if (!empStats) return null;

  return (
    <div className={styles.tabContent}>
      <StatsGrid stats={stats} columns={4} variant="bar" />

      <div className={styles.chartsRow}>
        <div className={styles.chartSection}>
          <Text variant="labelMedium" weight="semibold" color="secondary">Продажі за 7 днів</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={empStats.dailySales} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.textSecondary }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={styles.chartSection}>
          <Text variant="labelMedium" weight="semibold" color="secondary">Години за 7 днів</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={empStats.dailyHours} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.textSecondary }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill={chartColors.info} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string | null>('personal');
  const { user } = useAuth();
  const { data: employees, isLoading } = useEmployees();

  // Find the employee record matching the current auth user
  const myEmployee = useMemo(() => {
    if (!employees || !user) return null;
    return employees.find(
      (e) => e.name === user.username || e.email === user.email
    ) || null;
  }, [employees, user]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><Spinner size="md" /></div>
      </div>
    );
  }

  if (!myEmployee) {
    return (
      <div className={styles.page}>
        <GlassCard className={styles.profileCard}>
          <Text variant="bodyLarge" color="secondary">Профіль не знайдено</Text>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CategoryTabs
        categories={TABS}
        value={activeTab}
        showAll={false}
        onChange={setActiveTab}
      />

      {activeTab === 'personal' && <PersonalInfoTab employee={myEmployee} />}
      {activeTab === 'shifts' && <ShiftsTab employeeName={myEmployee.name} employeeId={myEmployee.documentId} />}
      {activeTab === 'stats' && <StatsTab employeeId={myEmployee.documentId} />}
    </div>
  );
}
