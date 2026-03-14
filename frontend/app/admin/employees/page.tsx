'use client';

/**
 * CoffeePOS - Admin Employees Page
 *
 * Employee management: list with CRUD + KPI tab with line chart and performance table
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Text, Button, Icon, Badge, GlassCard, Modal, Spinner } from '@/components/atoms';
import { SegmentedControl, SearchInput, EmployeeCard } from '@/components/molecules';
import { DataTable, EmployeeFormModal, type Column } from '@/components/organisms';
import {
  useEmployees,
  useEmployeePerformance,
  useDeleteEmployee,
  useMonthlyReport,
} from '@/lib/hooks';
import type { Employee, EmployeePerformance } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { employeeKeys } from '@/lib/hooks/useEmployees';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const TABS = [
  { id: 'list', label: 'Працівники' },
  { id: 'kpi', label: 'KPI' },
];

const ROLE_LABELS: Record<string, string> = {
  owner: 'Власник',
  manager: 'Менеджер',
  barista: 'Бариста',
};

const ROLE_VARIANTS: Record<string, 'warning' | 'info' | 'default'> = {
  owner: 'warning',
  manager: 'info',
  barista: 'default',
};

const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];

// KPI metric toggle options
const KPI_METRICS = [
  { id: 'revenue',  label: 'Продажі',    icon: 'cash',    color: 'accent'  },
  { id: 'orders',   label: 'Замовлення', icon: 'receipt', color: 'info'    },
  { id: 'avgCheck', label: 'Сер. чек',   icon: 'chart',   color: 'success' },
] as const;

type KpiMetricId = typeof KPI_METRICS[number]['id'];

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[2]}.${parts[1]}`;
}

// ============================================
// LIST TAB
// ============================================

function EmployeesListTab() {
  const [search, setSearch] = useState('');
  const [employeeModal, setEmployeeModal] = useState<{ isOpen: boolean; employee: Employee | null }>({ isOpen: false, employee: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; documentId: string; name: string } | null>(null);

  const queryClient = useQueryClient();
  const deleteEmployeeMutation = useDeleteEmployee();

  const { data: employees, isLoading } = useEmployees({
    search: search || undefined,
  });

  const handleCreateEmployee = useCallback(() => {
    setEmployeeModal({ isOpen: true, employee: null });
  }, []);

  const handleEditEmployee = useCallback((emp: Employee) => {
    setEmployeeModal({ isOpen: true, employee: emp });
  }, []);

  const handleDeleteEmployee = useCallback((documentId: string, name: string) => {
    setDeleteConfirm({ isOpen: true, documentId, name });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteEmployeeMutation.mutateAsync(deleteConfirm.documentId);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteEmployeeMutation]);

  const handleEmployeeSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
  }, [queryClient]);

  // Mobile search
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);

  useEffect(() => {
    const handler = () => handleCreateEmployee();
    window.addEventListener('appshell:action', handler);
    return () => window.removeEventListener('appshell:action', handler);
  }, [handleCreateEmployee]);

  const columns: Column<Employee>[] = useMemo(() => [
    {
      key: 'name',
      header: "Ім'я",
      type: 'primary' as const,
      render: (emp) => <EmployeeCard employee={emp} showStatus />,
    },
    {
      key: 'phone',
      header: 'Телефон',
      width: '140px',
      hideOnMobile: true,
      render: (emp) => emp.phone ? (
        <a href={`tel:${emp.phone}`} className={styles.phoneLink} onClick={(e) => e.stopPropagation()}>
          <Icon name="phone" size="sm" color="accent" />
          <Text variant="bodySmall">{emp.phone}</Text>
        </a>
      ) : (
        <Text variant="bodySmall" color="tertiary">—</Text>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: '100px',
      hideOnMobile: true,
      render: (emp) => (
        <Badge variant={emp.isActive ? 'success' : 'error'} size="sm">
          {emp.isActive ? 'Активний' : 'Неактивний'}
        </Badge>
      ),
    },
    {
      key: 'hireDate',
      header: 'Дата найму',
      width: '120px',
      type: 'meta' as const,
      hideOnMobile: true,
      hideOnTablet: true,
      render: (emp) => (
        <Text variant="bodySmall" color="tertiary">
          {new Date(emp.hireDate).toLocaleDateString('uk-UA')}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      type: 'action' as const,
      align: 'right',
      width: '90px',
      render: (emp) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEditEmployee(emp); }}
          >
            <Icon name="edit" size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.documentId, emp.name); }}
          >
            <Icon name="delete" size="sm" />
          </Button>
        </div>
      ),
    },
  ], [handleEditEmployee, handleDeleteEmployee]);

  return (
    <>
      {mobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук працівника..."
            variant="glass"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => { setMobileSearchOpen(false); setSearch(''); }}
            aria-label="Закрити пошук"
          >
            <Icon name="close" size="md" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingState}>
          <Spinner size="md" />
          <Text variant="bodyLarge" color="secondary">Завантаження...</Text>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={employees || []}
          getRowKey={(emp) => String(emp.id)}
          onRowClick={(emp) => handleEditEmployee(emp)}
          emptyState={{ icon: 'user', title: 'Працівників не знайдено' }}
        />
      )}

      <EmployeeFormModal
        isOpen={employeeModal.isOpen}
        onClose={() => setEmployeeModal({ isOpen: false, employee: null })}
        employee={employeeModal.employee}
        onSuccess={handleEmployeeSuccess}
      />

      {deleteConfirm && (
        <Modal
          open={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm(null)}
          title="Видалити працівника?"
          icon="delete"
          size="sm"
          footer={
            <div className={styles.deleteFooter}>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Скасувати</Button>
              <Button variant="primary" onClick={handleConfirmDelete} loading={deleteEmployeeMutation.isPending}>
                Видалити
              </Button>
            </div>
          }
        >
          <Text variant="bodyMedium" color="secondary">
            Ви впевнені, що хочете видалити &quot;{deleteConfirm.name}&quot;? Цю дію неможливо скасувати.
          </Text>
        </Modal>
      )}
    </>
  );
}

// ============================================
// KPI TAB
// ============================================

function KpiTab() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [activeMetric, setActiveMetric] = useState<KpiMetricId>('revenue');

  const isCurrentMonth =
    selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else { setSelectedMonth((m) => m - 1); }
  };
  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else { setSelectedMonth((m) => m + 1); }
  };

  const { data: performance, isLoading: isPerfLoading } = useEmployeePerformance({ month: selectedMonth, year: selectedYear });
  const { data: monthlyReport, isLoading: isMonthlyLoading } = useMonthlyReport(selectedYear, selectedMonth);

  const [chartColors, setChartColors] = useState({
    accent: '#3D3D3D',
    info: '#007AFF',
    success: '#30B350',
    warning: '#FF9500',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
    white: '#ffffff',
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setChartColors({
      accent: get('--color-accent-600') || '#3D3D3D',
      info: get('--color-info') || '#007AFF',
      success: get('--color-success') || '#30B350',
      warning: get('--color-warning') || '#FF9500',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
      white: get('--color-neutral-0') || '#ffffff',
    });
  }, []);

  // Build daily time-series for the selected metric from monthly report
  const chartData = useMemo(() => {
    if (!monthlyReport?.days) return [];
    return [...monthlyReport.days]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => {
        const avgCheck = day.ordersCount > 0 ? Math.round(day.revenue / day.ordersCount) : 0;
        return {
          date: getShortDate(day.date),
          revenue: Math.round(day.revenue),
          orders: day.ordersCount,
          avgCheck,
          // hours from daily data isn't available; show 0 (performance table has monthly totals)
          hours: 0,
        };
      });
  }, [monthlyReport]);

  const currentMetric = KPI_METRICS.find((m) => m.id === activeMetric)!;

  // Derive active metric's color
  const metricColor = {
    revenue: chartColors.accent,
    orders: chartColors.info,
    avgCheck: chartColors.success,
  }[activeMetric];

  // Summary value for the active metric
  const metricSummary = useMemo(() => {
    if (!monthlyReport?.days) return null;
    const days = monthlyReport.days;
    switch (activeMetric) {
      case 'revenue':
        return { value: `₴${formatCurrency(monthlyReport.summary?.totalRevenue || 0)}`, label: 'за місяць' };
      case 'orders':
        return { value: String(monthlyReport.summary?.totalOrders || 0), label: 'замовлень' };
      case 'avgCheck':
        return { value: `₴${formatCurrency(Math.round(monthlyReport.summary?.avgOrder || 0))}`, label: 'сер. чек' };
      default:
        return null;
    }
  }, [activeMetric, monthlyReport, performance]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const formatted =
        activeMetric === 'revenue' || activeMetric === 'avgCheck'
          ? `₴${formatCurrency(val)}`
          : String(val);
      return (
        <div className={styles.chartTooltip}>
          <Text variant="labelSmall" color="tertiary">{label}</Text>
          <Text variant="labelMedium" weight="bold">{formatted}</Text>
        </div>
      );
    }
    return null;
  };

  // Sort by sales descending and compute rank + relative bar width
  type RankedPerformance = EmployeePerformance & { rank: number; salesPct: number };

  const rankedPerformance = useMemo((): RankedPerformance[] => {
    if (!performance) return [];
    const sorted = [...performance].sort((a, b) => b.totalSales - a.totalSales);
    const maxSales = sorted[0]?.totalSales || 1;
    return sorted.map((p, i) => ({
      ...p,
      rank: i + 1,
      salesPct: maxSales > 0 ? (p.totalSales / maxSales) * 100 : 0,
    }));
  }, [performance]);

  const performanceColumns: Column<RankedPerformance>[] = useMemo(() => [
    {
      key: 'rank',
      header: '#',
      width: '48px',
      render: (p) => (
        <div className={styles.rankCell}>
          <span className={`${styles.rankNum} ${p.rank === 1 ? styles.rank1 : p.rank === 2 ? styles.rank2 : p.rank === 3 ? styles.rank3 : ''}`}>
            {p.rank}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      header: "Ім'я",
      type: 'primary' as const,
      render: (p) => (
        <div className={styles.perfNameCell}>
          <Text variant="labelMedium" weight="semibold">{p.employeeName}</Text>
          <Badge variant={ROLE_VARIANTS[p.role] || 'default'} size="sm">
            {ROLE_LABELS[p.role] || p.role}
          </Badge>
        </div>
      ),
    },
    {
      key: 'shifts',
      header: 'Зміни / год',
      width: '100px',
      type: 'numeric' as const,
      hideOnMobile: true,
      render: (p) => (
        <div className={styles.shiftsCell}>
          <Text variant="bodySmall" weight="semibold">{p.shiftsCount} зм</Text>
          <Text variant="caption" color="tertiary">{p.totalHours} год</Text>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Замовл.',
      width: '80px',
      type: 'numeric' as const,
      hideOnMobile: true,
      render: (p) => <Text variant="bodySmall">{p.totalOrders}</Text>,
    },
    {
      key: 'sales',
      header: 'Продажі',
      width: '140px',
      type: 'numeric' as const,
      render: (p) => (
        <div className={styles.salesCell}>
          <Text variant="labelSmall" weight="bold">₴{formatCurrency(p.totalSales)}</Text>
          <div className={styles.salesBar}>
            <div className={styles.salesBarFill} style={{ width: `${p.salesPct}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'avg',
      header: 'Сер. чек',
      width: '90px',
      type: 'numeric' as const,
      hideOnMobile: true,
      render: (p) => <Text variant="bodySmall" color="secondary">₴{formatCurrency(p.avgOrderValue)}</Text>,
    },
  ], []);

  return (
    <div className={styles.analyticsContent}>
      {/* Month navigation */}
      <div className={styles.monthNav}>
        <Button variant="ghost" size="sm" iconOnly onClick={goToPrevMonth} aria-label="Попередній місяць">
          <Icon name="chevron-left" size="md" />
        </Button>
        <div className={styles.monthTitle}>
          <Text variant="labelLarge" weight="semibold">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Text>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          aria-label="Наступний місяць"
        >
          <Icon name="chevron-right" size="md" />
        </Button>
      </div>

      {/* Single line chart with metric toggles */}
      <GlassCard className={styles.kpiChartCard} elevated>
        {/* Chart header: title + summary + metric toggles */}
        <div className={styles.kpiChartHeader}>
          <div className={styles.kpiChartMeta}>
            <div className={styles.chartTitle}>
              <Icon name={currentMetric.icon as any} size="sm" color={currentMetric.color as any} />
              <Text variant="h5" weight="semibold">{currentMetric.label}</Text>
            </div>
            {metricSummary && (
              <div className={styles.kpiSummary}>
                <Text variant="h3" weight="bold">{metricSummary.value}</Text>
                <Text variant="caption" color="tertiary">{metricSummary.label}</Text>
              </div>
            )}
          </div>
          <div className={styles.metricToggle}>
            {KPI_METRICS.map((m) => (
              <button
                key={m.id}
                className={`${styles.metricBtn} ${activeMetric === m.id ? styles.metricBtnActive : ''}`}
                onClick={() => setActiveMetric(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className={styles.kpiChartContainer}>
          {isMonthlyLoading ? (
            <div className={styles.loadingState}><Spinner size="md" /></div>
          ) : chartData.length === 0 ? (
            <div className={styles.hoursNote}>
              <Icon name="chart" size="xl" color="tertiary" />
              <Text variant="bodySmall" color="tertiary">Немає даних за обраний місяць</Text>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={metricColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: chartColors.textSecondary }}
                  axisLine={{ stroke: chartColors.gridStroke }}
                  tickLine={false}
                  interval={chartData.length > 15 ? Math.floor(chartData.length / 10) : 0}
                />
                <YAxis
                  width={50}
                  tick={{ fontSize: 11, fill: chartColors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    activeMetric === 'revenue' || activeMetric === 'avgCheck'
                      ? v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      : String(v)
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={activeMetric === 'avgCheck' ? 'avgCheck' : activeMetric === 'orders' ? 'orders' : 'revenue'}
                  stroke={metricColor}
                  strokeWidth={2.5}
                  fill="url(#kpiGrad)"
                  dot={{ fill: metricColor, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: metricColor, strokeWidth: 2, stroke: chartColors.white }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* Performance table */}
      <GlassCard className={styles.tableCard} elevated>
        <div className={styles.chartTitle}>
          <Icon name="chart" size="sm" color="accent" />
          <Text variant="h5" weight="semibold">Ефективність за місяць</Text>
        </div>
        {isPerfLoading ? (
          <div className={styles.loadingState}>
            <Spinner size="md" />
          </div>
        ) : (
          <DataTable
            columns={performanceColumns}
            data={rankedPerformance}
            getRowKey={(p) => String(p.employeeId)}
            emptyState={{ icon: 'user', title: 'Немає даних' }}
          />
        )}
      </GlassCard>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className={styles.page}>
      <SegmentedControl
        options={TABS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'kpi' ? <KpiTab /> : <EmployeesListTab />}
    </div>
  );
}
