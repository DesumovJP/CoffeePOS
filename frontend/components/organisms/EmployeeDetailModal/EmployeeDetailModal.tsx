'use client';

/**
 * CoffeePOS - EmployeeDetailModal Component
 *
 * Detailed employee view with stats, charts, and shifts table.
 * Stats are filtered by selected month (default: current month).
 */

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Text, Button, Icon, Modal, Badge, Avatar, Spinner } from '@/components/atoms';
import { StatsGrid, type StatItem } from '@/components/molecules';
import { useEmployeeStats } from '@/lib/hooks';
import type { Employee } from '@/lib/api';
import styles from './EmployeeDetailModal.module.css';

// ============================================
// TYPES
// ============================================

export interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
}

// ============================================
// CONSTANTS
// ============================================

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

// ============================================
// HELPERS
// ============================================

// ============================================
// COMPONENT
// ============================================

export function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  onEdit,
}: EmployeeDetailModalProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear]   = useState(today.getFullYear());

  // Reset to current month when a different employee is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(today.getMonth() + 1);
      setSelectedYear(today.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.documentId, isOpen]);

  const isCurrentMonth =
    selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return; // cannot navigate to future
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const { data: stats, isLoading: statsLoading } = useEmployeeStats(
    employee?.documentId || '',
    { month: selectedMonth, year: selectedYear }
  );

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

  const statItems: StatItem[] = useMemo(() => {
    if (!stats) return [];
    return [
      { id: 'shifts', label: 'Змін', value: stats.totalShifts, icon: 'clock' as const, iconColor: 'accent' as const },
      { id: 'hours', label: 'Годин', value: stats.totalHours, icon: 'calendar' as const, iconColor: 'success' as const },
      { id: 'orders', label: 'Замовлень', value: stats.totalOrders, icon: 'receipt' as const, iconColor: 'info' as const },
      { id: 'sales', label: 'Продажі', value: `₴${stats.totalSales.toLocaleString('uk-UA')}`, icon: 'cash' as const, iconColor: 'warning' as const },
    ];
  }, [stats]);

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

  if (!employee) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Деталі працівника"
      icon="user"
      size="lg"
    >
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Avatar src={employee.avatar?.url} fallback={employee.name} size="lg" status={employee.isActive ? 'online' : 'offline'} />
            <div className={styles.headerInfo}>
              <Text variant="h4" weight="bold">{employee.name}</Text>
              <div className={styles.headerMeta}>
                <Badge variant={ROLE_VARIANTS[employee.role] || 'default'} size="md">
                  {ROLE_LABELS[employee.role] || employee.role}
                </Badge>
                {employee.position && (
                  <Text variant="bodySmall" color="secondary">{employee.position}</Text>
                )}
              </div>
            </div>
          </div>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(employee)}>
              <Icon name="edit" size="sm" />
              Редагувати
            </Button>
          )}
        </div>

        {/* Info row */}
        <div className={styles.infoRow}>
          {employee.email && (
            <div className={styles.infoItem}>
              <Text variant="caption" color="tertiary">Email</Text>
              <Text variant="bodySmall" weight="medium">{employee.email}</Text>
            </div>
          )}
          {employee.phone && (
            <div className={styles.infoItem}>
              <Text variant="caption" color="tertiary">Телефон</Text>
              <Text variant="bodySmall" weight="medium">{employee.phone}</Text>
            </div>
          )}
          <div className={styles.infoItem}>
            <Text variant="caption" color="tertiary">Дата найму</Text>
            <Text variant="bodySmall" weight="medium">
              {new Date(employee.hireDate).toLocaleDateString('uk-UA')}
            </Text>
          </div>
        </div>

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

        {/* Stats */}
        {statsLoading ? (
          <div className={styles.loading}><Spinner size="md" /></div>
        ) : stats ? (
          <>
            <StatsGrid stats={statItems} columns={4} variant="bar" />

            {/* Sales chart */}
            <div className={styles.chartSection}>
              <Text variant="labelMedium" weight="semibold" color="secondary">
                Продажі за {MONTHS[selectedMonth - 1].toLowerCase()}
              </Text>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailySales} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id="empSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.accent} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartColors.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.textSecondary }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: chartColors.textSecondary }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={chartColors.accent}
                      strokeWidth={2.5}
                      fill="url(#empSalesGrad)"
                      dot={{ fill: chartColors.accent, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: chartColors.accent, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}

      </div>
    </Modal>
  );
}

export default EmployeeDetailModal;
