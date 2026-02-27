'use client';

/**
 * CoffeePOS - Profile Page
 *
 * Single-scroll employee dashboard: hero + charts + shift history.
 * No tabs — all data visible at once.
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
import { Text, Avatar, Badge, GlassCard, Spinner, Icon } from '@/components/atoms';
import { DataTable, type Column } from '@/components/organisms';
import { useEmployees, useEmployeeStats, useShifts } from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import type { Shift } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

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

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// CHART TOOLTIP
// ============================================

function ChartTooltip({ active, payload, label, valuePrefix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <Text variant="labelSmall" color="tertiary">{label}</Text>
      <Text variant="labelMedium" weight="bold">{valuePrefix}{payload[0].value}</Text>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: employees, isLoading } = useEmployees();

  const myEmployee = useMemo(() => {
    if (!employees || !user) return null;
    return (
      employees.find((e) => e.name === user.username || e.email === user.email) || null
    );
  }, [employees, user]);

  const { data: empStats } = useEmployeeStats(myEmployee?.documentId ?? '');
  const { data: allShifts, isLoading: shiftsLoading } = useShifts();

  const myShifts = useMemo(() => {
    if (!allShifts || !myEmployee) return [];
    return allShifts.filter((s) => s.openedBy === myEmployee.name);
  }, [allShifts, myEmployee]);

  const totalHours = useMemo(
    () => myShifts.reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0),
    [myShifts]
  );

  // Chart colors from CSS vars
  const [colors, setColors] = useState({
    accent: '#2C2C2E',
    info: '#007AFF',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setColors({
      accent: get('--color-accent') || '#2C2C2E',
      info: get('--color-info') || '#007AFF',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
    });
  }, []);

  // Shift table columns
  const shiftColumns: Column<Shift>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Дата',
      width: '110px',
      render: (s) => (
        <Text variant="bodyMedium" weight="medium">
          {new Date(s.openedAt).toLocaleDateString('uk-UA')}
        </Text>
      ),
    },
    {
      key: 'time',
      header: 'Час',
      width: '160px',
      render: (s) => (
        <Text variant="bodySmall" color="secondary">
          {new Date(s.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          {' — '}
          {s.closedAt
            ? new Date(s.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
            : 'зараз'}
        </Text>
      ),
    },
    {
      key: 'duration',
      header: 'Тривалість',
      width: '100px',
      render: (s) => (
        <Text variant="labelMedium" weight="semibold">
          {calculateDuration(s.openedAt, s.closedAt)}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: '100px',
      render: (s) => (
        <Badge variant={s.status === 'open' ? 'success' : 'default'} size="sm">
          {s.status === 'open' ? 'Активна' : 'Закрита'}
        </Badge>
      ),
    },
    {
      key: 'orders',
      header: 'Замовлень',
      width: '100px',
      align: 'right',
      hideOnMobile: true,
      render: (s) => (
        <Text variant="bodySmall" color="secondary">{s.ordersCount}</Text>
      ),
    },
    {
      key: 'sales',
      header: 'Продажі',
      width: '110px',
      align: 'right',
      render: (s) => (
        <Text variant="labelMedium" weight="semibold">
          ₴{(s.totalSales || 0).toFixed(0)}
        </Text>
      ),
    },
  ], []);

  // ── Loading ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCenter}><Spinner size="md" /></div>
      </div>
    );
  }

  // ── No employee found ────────────────────────────────
  if (!myEmployee) {
    return (
      <div className={styles.page}>
        <GlassCard className={styles.emptyState}>
          <Icon name="user" size="2xl" color="tertiary" />
          <Text variant="bodyLarge" color="secondary">Профіль не знайдено</Text>
          <Text variant="bodySmall" color="tertiary">
            Обліковий запис не прив'язаний до жодного працівника
          </Text>
        </GlassCard>
      </div>
    );
  }

  const roleLabel = myEmployee.position || ROLE_LABELS[myEmployee.role] || myEmployee.role;

  return (
    <div className={styles.page}>

      {/* ══════════════════════════════════════════════
          HERO CARD — avatar + identity + key metrics
          ══════════════════════════════════════════════ */}
      <GlassCard className={styles.heroCard}>

        {/* Top row: avatar + name | hire info */}
        <div className={styles.heroTop}>
          <div className={styles.heroIdentity}>
            <Avatar
              fallback={myEmployee.name}
              size="xl"
              status={myEmployee.isActive ? 'online' : 'offline'}
            />
            <div className={styles.heroInfo}>
              <Text variant="h3" weight="bold">{myEmployee.name}</Text>
              <div className={styles.heroMeta}>
                <Badge variant="info" size="sm">{roleLabel}</Badge>
                {myEmployee.email && (
                  <Text variant="bodySmall" color="secondary">{myEmployee.email}</Text>
                )}
                {myEmployee.phone && (
                  <Text variant="bodySmall" color="secondary">{myEmployee.phone}</Text>
                )}
              </div>
            </div>
          </div>

          {myEmployee.hireDate && (
            <div className={styles.hireBadge}>
              <Icon name="calendar" size="sm" color="tertiary" />
              <div className={styles.hireText}>
                <Text variant="bodySmall" weight="semibold">
                  {daysSince(myEmployee.hireDate)} днів в команді
                </Text>
                <Text variant="caption" color="tertiary">
                  з {new Date(myEmployee.hireDate).toLocaleDateString('uk-UA')}
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <Text variant="h4" weight="bold">{myShifts.length}</Text>
            <Text variant="caption" color="tertiary">Всього змін</Text>
          </div>

          <div className={styles.heroStatDivider} aria-hidden />

          <div className={styles.heroStat}>
            <Text variant="h4" weight="bold">{totalHours.toFixed(0)}</Text>
            <Text variant="caption" color="tertiary">Годин роботи</Text>
          </div>

          {empStats && (
            <>
              <div className={styles.heroStatDivider} aria-hidden />
              <div className={styles.heroStat}>
                <Text variant="h4" weight="bold">{empStats.totalOrders}</Text>
                <Text variant="caption" color="tertiary">Замовлень / міс</Text>
              </div>

              <div className={styles.heroStatDivider} aria-hidden />
              <div className={styles.heroStat}>
                <Text variant="h4" weight="bold">
                  ₴{empStats.totalSales.toLocaleString('uk-UA')}
                </Text>
                <Text variant="caption" color="tertiary">Продажі / міс</Text>
              </div>

              <div className={styles.heroStatDivider} aria-hidden />
              <div className={styles.heroStat}>
                <Text variant="h4" weight="bold">₴{empStats.avgOrderValue}</Text>
                <Text variant="caption" color="tertiary">Сер. чек</Text>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════
          CHARTS — sales + hours last 7 days
          ══════════════════════════════════════════════ */}
      {empStats && (
        <div className={styles.chartsRow}>
          <GlassCard className={styles.chartCard}>
            <Text variant="labelLarge" weight="semibold">Продажі за 7 днів</Text>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={empStats.dailySales}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profileSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={colors.accent} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip valuePrefix="₴" />} cursor={{ fill: 'var(--glass-bg-subtle)' }} />
                  <Bar dataKey="sales" fill="url(#profileSalesGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className={styles.chartCard}>
            <Text variant="labelLarge" weight="semibold">Години за 7 днів</Text>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={empStats.dailyHours}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profileHoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.info} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={colors.info} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--glass-bg-subtle)' }} />
                  <Bar dataKey="hours" fill="url(#profileHoursGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SHIFT HISTORY TABLE
          ══════════════════════════════════════════════ */}
      <GlassCard className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <Text variant="labelLarge" weight="semibold">Мої зміни</Text>
          <Badge variant="default" size="sm">{myShifts.length}</Badge>
        </div>
        <DataTable
          columns={shiftColumns}
          data={myShifts}
          getRowKey={(s) => String(s.id)}
          loading={shiftsLoading}
          emptyState={{ icon: 'clock', title: 'Змін не знайдено' }}
        />
      </GlassCard>

    </div>
  );
}
