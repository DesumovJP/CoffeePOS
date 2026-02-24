'use client';

/**
 * CoffeePOS - Admin Employees Page
 *
 * Employee management: list with CRUD + analytics with charts
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Text, Button, Icon, Badge, GlassCard, Modal, Spinner } from '@/components/atoms';
import { CategoryTabs, SearchInput, StatsGrid, EmployeeCard, type StatItem } from '@/components/molecules';
import { DataTable, EmployeeFormModal, EmployeeDetailModal, type Column } from '@/components/organisms';
import {
  useEmployees,
  useEmployeePerformance,
  useDeleteEmployee,
} from '@/lib/hooks';
import type { Employee, EmployeePerformance } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { employeeKeys } from '@/lib/hooks/useEmployees';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const TABS = [
  { id: 'list', name: 'Працівники' },
  { id: 'analytics', name: 'Аналітика' },
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

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================
// LIST TAB
// ============================================

function EmployeesListTab() {
  const [search, setSearch] = useState('');
  const [employeeModal, setEmployeeModal] = useState<{ isOpen: boolean; employee: Employee | null }>({ isOpen: false, employee: null });
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; employee: Employee | null }>({ isOpen: false, employee: null });
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
    setDetailModal({ isOpen: false, employee: null });
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
      render: (emp) => <EmployeeCard employee={emp} compact showStatus />,
    },
    {
      key: 'role',
      header: 'Роль',
      width: '120px',
      hideOnMobile: true,
      render: (emp) => (
        <Badge variant={ROLE_VARIANTS[emp.role] || 'default'} size="sm">
          {ROLE_LABELS[emp.role] || emp.role}
        </Badge>
      ),
    },
    {
      key: 'position',
      header: 'Посада',
      width: '160px',
      hideOnMobile: true,
      hideOnTablet: true,
      render: (emp) => (
        <Text variant="bodySmall" color="secondary">{emp.position || '—'}</Text>
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
      header: 'Дії',
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
          onRowClick={(emp) => setDetailModal({ isOpen: true, employee: emp })}
          emptyState={{ icon: 'user', title: 'Працівників не знайдено' }}
        />
      )}

      <EmployeeFormModal
        isOpen={employeeModal.isOpen}
        onClose={() => setEmployeeModal({ isOpen: false, employee: null })}
        employee={employeeModal.employee}
        onSuccess={handleEmployeeSuccess}
      />

      <EmployeeDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, employee: null })}
        employee={detailModal.employee}
        onEdit={handleEditEmployee}
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
// ANALYTICS TAB
// ============================================

const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];

function AnalyticsTab() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(today.getFullYear());

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

  const { data: employees } = useEmployees();
  const { data: performance, isLoading } = useEmployeePerformance({ month: selectedMonth, year: selectedYear });

  const [chartColors, setChartColors] = useState({
    accent: '#8B5E3C',
    info: '#007AFF',
    success: '#30B350',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setChartColors({
      accent: get('--color-accent-600') || '#8B5E3C',
      info: get('--color-info') || '#007AFF',
      success: get('--color-success') || '#30B350',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
    });
  }, []);

  const stats: StatItem[] = useMemo(() => {
    const total = employees?.length || 0;
    const active = employees?.filter((e) => e.isActive).length || 0;
    const totalHours = performance?.reduce((sum, p) => sum + p.totalHours, 0) || 0;
    const totalSales = performance?.reduce((sum, p) => sum + p.totalSales, 0) || 0;

    return [
      { id: 'total', label: 'Всього', value: total, icon: 'user' as const, iconColor: 'accent' as const },
      { id: 'active', label: 'Активних', value: active, icon: 'check' as const, iconColor: 'success' as const },
      { id: 'hours', label: 'Годин', value: totalHours.toFixed(1), icon: 'clock' as const, iconColor: 'info' as const },
      { id: 'sales', label: 'Продажі', value: `₴${formatCurrency(totalSales)}`, icon: 'cash' as const, iconColor: 'warning' as const },
    ];
  }, [employees, performance]);

  const performanceColumns: Column<EmployeePerformance>[] = useMemo(() => [
    {
      key: 'name',
      header: "Ім'я",
      render: (p) => <Text variant="bodySmall" weight="semibold">{p.employeeName}</Text>,
    },
    {
      key: 'role',
      header: 'Роль',
      width: '100px',
      hideOnMobile: true,
      render: (p) => (
        <Badge variant={ROLE_VARIANTS[p.role] || 'default'} size="sm">
          {ROLE_LABELS[p.role] || p.role}
        </Badge>
      ),
    },
    {
      key: 'shifts',
      header: 'Зміни',
      width: '80px',
      align: 'right',
      hideOnMobile: true,
      render: (p) => <Text variant="bodySmall">{p.shiftsCount}</Text>,
    },
    {
      key: 'hours',
      header: 'Годин',
      width: '80px',
      align: 'right',
      hideOnMobile: true,
      render: (p) => <Text variant="bodySmall">{p.totalHours}</Text>,
    },
    {
      key: 'orders',
      header: 'Замовлень',
      width: '100px',
      align: 'right',
      render: (p) => <Text variant="bodySmall">{p.totalOrders}</Text>,
    },
    {
      key: 'sales',
      header: 'Продажі',
      width: '110px',
      align: 'right',
      render: (p) => <Text variant="labelSmall" weight="semibold">₴{formatCurrency(p.totalSales)}</Text>,
    },
    {
      key: 'avg',
      header: 'Сер. чек',
      width: '100px',
      align: 'right',
      hideOnMobile: true,
      render: (p) => <Text variant="bodySmall" color="secondary">₴{formatCurrency(p.avgOrderValue)}</Text>,
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

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="md" />
        <Text variant="bodyLarge" color="secondary">Завантаження...</Text>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContent}>
      {/* Month navigation */}
      <div className={styles.monthNav}>
        <Button variant="ghost" size="sm" onClick={goToPrevMonth} aria-label="Попередній місяць">
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
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          aria-label="Наступний місяць"
        >
          <Icon name="chevron-right" size="md" />
        </Button>
      </div>

      <StatsGrid stats={stats} columns={4} variant="bar" />

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <GlassCard className={styles.chartCard} elevated>
          <div className={styles.chartTitle}>
            <Icon name="cash" size="sm" color="accent" />
            <Text variant="h5" weight="semibold">Продажі за працівником</Text>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} />
                <YAxis type="category" dataKey="employeeName" width={130} tick={{ fontSize: 12, fill: chartColors.textSecondary }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalSales" fill={chartColors.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className={styles.chartCard} elevated>
          <div className={styles.chartTitle}>
            <Icon name="clock" size="sm" color="info" />
            <Text variant="h5" weight="semibold">Годин відпрацьовано</Text>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} />
                <YAxis type="category" dataKey="employeeName" width={130} tick={{ fontSize: 12, fill: chartColors.textSecondary }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalHours" fill={chartColors.info} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className={styles.chartCard} elevated>
          <div className={styles.chartTitle}>
            <Icon name="receipt" size="sm" color="success" />
            <Text variant="h5" weight="semibold">Замовлення за працівником</Text>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} />
                <YAxis type="category" dataKey="employeeName" width={130} tick={{ fontSize: 12, fill: chartColors.textSecondary }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalOrders" fill={chartColors.success} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Performance table */}
      <GlassCard className={styles.tableCard} elevated>
        <div className={styles.chartTitle}>
          <Icon name="chart" size="sm" color="accent" />
          <Text variant="h5" weight="semibold">Порівняння ефективності</Text>
        </div>
        <DataTable
          columns={performanceColumns}
          data={performance || []}
          getRowKey={(p) => String(p.employeeId)}
          emptyState={{ icon: 'user', title: 'Немає даних' }}
        />
      </GlassCard>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState<string | null>('list');

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <CategoryTabs
          categories={TABS}
          value={activeTab}
          showAll={false}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'analytics' ? <AnalyticsTab /> : <EmployeesListTab />}
    </div>
  );
}
