'use client';

/**
 * CoffeePOS - Profile Page
 *
 * Compact employee dashboard: hero (2-col) + preferences + shift history.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Text, Avatar, Badge, GlassCard, Spinner, Icon, Button, ThemeToggle } from '@/components/atoms';
import { DataTable, type Column } from '@/components/organisms';
import { ShiftCloseModal } from '@/components/organisms/ShiftCloseModal';
import { useEmployees, useEmployeeStats, useShifts } from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useShiftStore, selectCurrentShift, usePreferencesStore, type UIDensity, type FontSizePreference } from '@/lib/store';
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
// UI PREFERENCES SECTION
// ============================================

function UIPreferencesSection() {
  const uiDensity = usePreferencesStore((s) => s.uiDensity);
  const setUIDensity = usePreferencesStore((s) => s.setUIDensity);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);
  const setAnimationsEnabled = usePreferencesStore((s) => s.setAnimationsEnabled);

  const densityOptions: { value: UIDensity; label: string }[] = [
    { value: 'compact', label: 'Компактний' },
    { value: 'default', label: 'Стандартний' },
    { value: 'comfortable', label: 'Вільний' },
  ];

  const fontOptions: { value: FontSizePreference; label: string }[] = [
    { value: 'small', label: 'Малий' },
    { value: 'default', label: 'Стандартний' },
    { value: 'large', label: 'Великий' },
  ];

  return (
    <GlassCard className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <Text variant="labelLarge" weight="semibold">Налаштування</Text>
      </div>
      <div className={styles.prefsGrid}>
        {/* Theme */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="moon" size="sm" color="secondary" />
            <Text variant="bodyMedium">Тема</Text>
          </div>
          <ThemeToggle variant="expanded" />
        </div>

        {/* Density */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="grip" size="sm" color="secondary" />
            <Text variant="bodyMedium">Щільність</Text>
          </div>
          <div className={styles.prefButtons}>
            {densityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.prefBtn} ${uiDensity === opt.value ? styles.prefBtnActive : ''}`}
                onClick={() => setUIDensity(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="eye" size="sm" color="secondary" />
            <Text variant="bodyMedium">Текст</Text>
          </div>
          <div className={styles.prefButtons}>
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.prefBtn} ${fontSize === opt.value ? styles.prefBtnActive : ''}`}
                onClick={() => setFontSize(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Animations */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="sparkle" size="sm" color="secondary" />
            <Text variant="bodyMedium">Анімації</Text>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${animationsEnabled ? styles.toggleOn : ''}`}
            onClick={() => setAnimationsEnabled(!animationsEnabled)}
            role="switch"
            aria-checked={animationsEnabled}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfilePage() {
  const { user } = useAuth();
  const currentShift = useShiftStore(selectCurrentShift);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
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
      type: 'primary' as const,
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
      type: 'meta' as const,
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
      type: 'numeric' as const,
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
      type: 'numeric' as const,
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
          HERO — 2-column: identity left, stats right
          ══════════════════════════════════════════════ */}
      <div className={styles.heroRow}>
        {/* Left: identity card */}
        <GlassCard className={styles.heroCard}>
          {/* Active shift close button */}
          {currentShift?.status === 'open' && (
            <div className={styles.heroShiftBar}>
              <div className={styles.heroShiftInfo}>
                <Icon name="clock" size="sm" color="success" />
                <Text variant="labelSmall" weight="semibold" color="success">
                  Зміна відкрита
                </Text>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setCloseShiftOpen(true)}>
                Закрити
              </Button>
            </div>
          )}

          <div className={styles.heroIdentity}>
            <Avatar
              src={myEmployee.avatar?.url}
              fallback={myEmployee.name}
              size="xl"
              status={myEmployee.isActive ? 'online' : 'offline'}
            />
            <div className={styles.heroInfo}>
              <Text variant="h4" weight="bold">{myEmployee.name}</Text>
              <div className={styles.heroMeta}>
                <Badge variant="info" size="sm">{roleLabel}</Badge>
                {myEmployee.email && (
                  <Text variant="caption" color="secondary">{myEmployee.email}</Text>
                )}
              </div>
              {myEmployee.hireDate && (
                <Text variant="caption" color="tertiary">
                  {daysSince(myEmployee.hireDate)} днів в команді
                </Text>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Right: stats sidebar card (2×2 grid) */}
        <div className={styles.statsCard}>
          <div className={styles.statsGrid}>
            <div className={styles.statsCell}>
              <Text variant="caption" color="tertiary">Змін</Text>
              <Text variant="labelLarge" weight="bold">{myShifts.length}</Text>
            </div>
            <div className={styles.statsCell}>
              <Text variant="caption" color="tertiary">Годин</Text>
              <Text variant="labelLarge" weight="bold">{totalHours.toFixed(0)}</Text>
            </div>
          </div>
          {empStats && (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statsCell}>
                  <Text variant="caption" color="tertiary">Замовлень</Text>
                  <Text variant="labelMedium" weight="semibold">{empStats.totalOrders}</Text>
                </div>
                <div className={styles.statsCell}>
                  <Text variant="caption" color="tertiary">Сер. чек</Text>
                  <Text variant="labelMedium" weight="semibold">₴{empStats.avgOrderValue}</Text>
                </div>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statsCell}>
                  <Text variant="caption" color="tertiary">Продажі</Text>
                  <Text variant="labelMedium" weight="semibold">₴{empStats.totalSales.toLocaleString('uk-UA')}</Text>
                </div>
                <div className={styles.statsCell}>
                  <Text variant="caption" color="tertiary">Період</Text>
                  <Text variant="labelMedium" weight="semibold">Місяць</Text>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CHART — compact (only if stats available)
          ══════════════════════════════════════════════ */}
      {empStats && empStats.dailySales?.length > 0 && (
        <GlassCard className={styles.chartCard}>
          <Text variant="labelLarge" weight="semibold">Продажі за 7 днів</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={empStats.dailySales}
                margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="profileSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.textSecondary }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip valuePrefix="₴" />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={colors.accent}
                  strokeWidth={2.5}
                  fill="url(#profileSalesGrad)"
                  dot={{ fill: colors.accent, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: colors.accent, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* ══════════════════════════════════════════════
          UI PREFERENCES + SHIFT HISTORY
          ══════════════════════════════════════════════ */}
      <UIPreferencesSection />

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

      <ShiftCloseModal
        isOpen={closeShiftOpen}
        onClose={() => setCloseShiftOpen(false)}
      />
    </div>
  );
}
