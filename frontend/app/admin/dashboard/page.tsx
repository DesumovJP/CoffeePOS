'use client';

/**
 * CoffeePOS - Analytics Page (Аналітика)
 *
 * Merged Dashboard + Reports into a single page with two tabs:
 * - Огляд: Stats cards, revenue chart (7д/30д), payment pie, top products, monthly stats
 * - Календар: Calendar grid with day/shift detail modals and activity logs
 *
 * Shared month switcher controls both tabs.
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
import { Text, Icon, GlassCard, Spinner, Button, Modal } from '@/components/atoms';
import { SegmentedControl, ActivityInline, OrderCard } from '@/components/molecules';
import type { OrderData, SupplyAccordionData, WriteoffAccordionData } from '@/components/molecules';
import { useDailyReport, useMonthlyReport, useShifts } from '@/lib/hooks';
import type { MonthlyDayData, ShiftActivity } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// TABS
// ============================================

const TABS_SEGMENTED = [
  { id: 'overview', label: 'Огляд' },
  { id: 'calendar', label: 'Календар' },
];

// ============================================
// SHARED HELPERS
// ============================================

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

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

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toString();
}


const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];
const MONTHS_SHORT = [
  'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
  'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру',
];

function getCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

// ============================================
// TYPES
// ============================================

interface DayCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  ordersCount: number;
  revenue: number;
  cashSales: number;
  cardSales: number;
  writeOffsTotal: number;
  suppliesTotal: number;
  shiftsCount: number;
  shiftEmployees: string[];
}

type LegacyActivityType = 'order' | 'supply' | 'writeoff';

type DailyActivityItem =
  | { kind: 'accordion'; id: string; type: LegacyActivityType; createdAt: number; data: OrderData | SupplyAccordionData | WriteoffAccordionData }
  | { kind: 'inline'; activity: ShiftActivity; createdAt: number };

// ============================================
// COMPONENT
// ============================================

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Shared month state — controls both Overview and Calendar tabs
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  // Revenue chart period toggle (7d / 30d)
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  // ---- Chart colors (read from CSS vars) ----
  const [chartColors, setChartColors] = useState({
    brand: '#3D3D3D',
    success: '#30B350',
    info: '#007AFF',
    warning: '#FF9500',
    neutral: '#A0A0A0',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
    white: '#ffffff',
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setChartColors({
      brand: get('--color-accent-600') || '#3D3D3D',
      success: get('--color-success') || '#30B350',
      info: get('--color-info') || '#007AFF',
      warning: get('--color-warning') || '#FF9500',
      neutral: get('--color-neutral-400') || '#A0A0A0',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
      white: get('--color-neutral-0') || '#ffffff',
    });
  }, []);

  const today = new Date();
  const todayKey = getTodayKey();

  // Shared month navigation
  const isCurrentMonthSelected = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else { setCurrentMonth((m) => m - 1); }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else { setCurrentMonth((m) => m + 1); }
  };

  // ============================================
  // OVERVIEW + CALENDAR SHARED DATA
  // ============================================

  const { data: todayReport, isLoading: isTodayLoading } = useDailyReport(todayKey);
  // Single monthly report hook — used by both Overview and Calendar tabs
  const { data: monthlyReport, isLoading: isMonthlyLoading } = useMonthlyReport(
    currentYear,
    currentMonth + 1
  );
  // Monthly KPIs
  const monthRevenue = monthlyReport?.summary?.totalRevenue || 0;
  const monthOrders = monthlyReport?.summary?.totalOrders || 0;
  const monthAvgOrder = monthlyReport?.summary?.avgOrder || 0;

  // Revenue chart — 7d: last 7 days ending today (or end of month), 30d: all days of month
  const revenueChartData = useMemo(() => {
    if (!monthlyReport?.days) return [];
    if (chartPeriod === '30d') {
      return [...monthlyReport.days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => ({ date: getShortDate(day.date), revenue: day.revenue || 0 }));
    }
    // 7d: last 7 calendar days
    const endDate = isCurrentMonthSelected ? new Date() : new Date(currentYear, currentMonth + 1, 0);
    const days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const dayData = monthlyReport.days.find((day) => day.date === key);
      days.push({ date: getShortDate(key), revenue: dayData?.revenue || 0 });
    }
    return days;
  }, [monthlyReport, chartPeriod, currentMonth, currentYear, isCurrentMonthSelected]);

  // Top products — today's report (monthly topProducts not available from API)
  const topProducts = useMemo(() => {
    return (todayReport?.topProducts || []).slice(0, 5);
  }, [todayReport]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <Text variant="labelSmall" color="tertiary">{label}</Text>
          <Text variant="labelMedium" weight="bold">{'\u20B4'}{formatCurrency(payload[0].value)}</Text>
        </div>
      );
    }
    return null;
  };

  // ============================================
  // CALENDAR TAB DATA
  // ============================================

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayCell, setSelectedDayCell] = useState<DayCell | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DailyActivityItem | null>(null);

  const { data: selectedDayReport, isLoading: isDayLoading } = useDailyReport(selectedDayKey || '');

  const startOfMonth = useMemo(() => new Date(currentYear, currentMonth, 1).toISOString(), [currentYear, currentMonth]);
  const endOfMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).toISOString(), [currentYear, currentMonth]);
  const { data: monthShifts = [] } = useShifts({ startDate: startOfMonth, endDate: endOfMonth, pageSize: 100 });

  const dayDataMap = useMemo(() => {
    const map = new Map<string, MonthlyDayData>();
    if (monthlyReport?.days) {
      monthlyReport.days.forEach((day) => map.set(day.date, day));
    }
    return map;
  }, [monthlyReport]);

  const calendarDays = useMemo((): DayCell[] => {
    const days = getCalendarDays(currentYear, currentMonth);
    const todayKeyLocal = getDateKey(today);

    const shiftsByDay = new Map<string, string[]>();
    for (const shift of monthShifts) {
      const key = shift.openedAt.split('T')[0];
      const names = shiftsByDay.get(key) || [];
      if (shift.openedBy && !names.includes(shift.openedBy)) names.push(shift.openedBy);
      if (shift.closedBy && !names.includes(shift.closedBy)) names.push(shift.closedBy);
      shiftsByDay.set(key, names);
    }

    return days.map((date) => {
      const dateKey = getDateKey(date);
      const apiData = dayDataMap.get(dateKey);
      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isToday: dateKey === todayKeyLocal,
        isCurrentMonth: date.getMonth() === currentMonth,
        ordersCount: apiData?.ordersCount || 0,
        revenue: apiData?.revenue || 0,
        cashSales: apiData?.cashSales || 0,
        cardSales: apiData?.cardSales || 0,
        writeOffsTotal: apiData?.writeOffsTotal || 0,
        suppliesTotal: apiData?.suppliesTotal || 0,
        shiftsCount: apiData?.shiftsCount || 0,
        shiftEmployees: shiftsByDay.get(dateKey) || [],
      };
    });
  }, [currentMonth, currentYear, today, dayDataMap, monthShifts]);

  const monthSummary = useMemo(() => {
    if (monthlyReport?.summary) {
      return {
        totalRevenue: monthlyReport.summary.totalRevenue,
        totalOrders: monthlyReport.summary.totalOrders,
        avgOrder: monthlyReport.summary.avgOrder,
      };
    }
    const monthDays = calendarDays.filter(d => d.isCurrentMonth);
    const totalRevenue = monthDays.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = monthDays.reduce((sum, day) => sum + day.ordersCount, 0);
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrder };
  }, [monthlyReport, calendarDays]);

  const handleDayClick = (day: DayCell) => {
    if (day.ordersCount > 0 || day.shiftsCount > 0) {
      setSelectedDayKey(day.dateKey);
      setSelectedDayCell(day);
    }
  };

  const handleCloseModal = () => {
    setSelectedDayKey(null);
    setSelectedDayCell(null);
    setSelectedDetail(null);
  };

  // Transform daily report data for the selected day
  const dailyOrders: OrderData[] = useMemo(() => {
    if (!selectedDayReport?.orders) return [];
    return selectedDayReport.orders.map((order: any) => ({
      id: String(order.id || order.documentId),
      items: (order.items || []).map((item: any) => ({
        id: String(item.id),
        productId: String(item.product || ''),
        name: item.productName || item.name || '',
        price: item.unitPrice || 0,
        quantity: item.quantity || 1,
        modifiers: item.modifiers || [],
      })),
      createdAt: new Date(order.createdAt).getTime(),
      completedAt: order.completedAt ? new Date(order.completedAt).getTime() : undefined,
      status: order.status || 'completed',
    }));
  }, [selectedDayReport]);

  const dailySupplies: SupplyAccordionData[] = useMemo(() => {
    if (!selectedDayReport?.supplies) return [];
    return selectedDayReport.supplies.map((supply: any) => ({
      id: String(supply.id || supply.documentId),
      supplierName: supply.supplierName || '—',
      status: supply.status || 'received',
      items: (supply.items || []).map((item: any) => ({
        name: item.ingredientName || item.name || '',
        quantity: item.quantity || 0,
        unitCost: item.unitCost || 0,
        totalCost: item.totalCost || 0,
      })),
      totalCost: supply.totalCost || 0,
      createdAt: new Date(supply.createdAt).getTime(),
      receivedBy: supply.receivedBy,
    }));
  }, [selectedDayReport]);

  const dailyWriteoffs: WriteoffAccordionData[] = useMemo(() => {
    if (!selectedDayReport?.writeOffs) return [];
    return selectedDayReport.writeOffs.map((wo: any) => ({
      id: String(wo.id || wo.documentId),
      type: wo.type || 'other',
      reason: wo.reason,
      items: (wo.items || []).map((item: any) => ({
        name: item.ingredientName || item.name || '',
        quantity: item.quantity || 0,
        unitCost: item.unitCost || 0,
        totalCost: item.totalCost || 0,
      })),
      totalCost: wo.totalCost || 0,
      createdAt: new Date(wo.createdAt).getTime(),
      performedBy: wo.performedBy,
    }));
  }, [selectedDayReport]);

  const ordersById = useMemo(() => {
    const map = new Map<string, OrderData>();
    dailyOrders.forEach((o) => map.set(o.id, o));
    return map;
  }, [dailyOrders]);

  const suppliesById = useMemo(() => {
    const map = new Map<string, SupplyAccordionData>();
    dailySupplies.forEach((s) => map.set(s.id, s));
    return map;
  }, [dailySupplies]);

  const writeoffsById = useMemo(() => {
    const map = new Map<string, WriteoffAccordionData>();
    dailyWriteoffs.forEach((w) => map.set(w.id, w));
    return map;
  }, [dailyWriteoffs]);

  const dailyActivities = useMemo((): DailyActivityItem[] => {
    const serverActivities = selectedDayReport?.activities;

    if (serverActivities && serverActivities.length > 0) {
      const items: DailyActivityItem[] = [];
      const usedOrderIds = new Set<string>();
      const usedSupplyIds = new Set<string>();
      const usedWriteoffIds = new Set<string>();

      for (const activity of serverActivities) {
        const ts = new Date(activity.timestamp).getTime();
        if (activity.type === 'order_create') {
          const orderId = String(activity.details.orderId);
          const order = ordersById.get(orderId);
          if (order) { usedOrderIds.add(orderId); items.push({ kind: 'accordion', id: `order-${orderId}`, type: 'order', createdAt: ts, data: order }); }
        } else if (activity.type === 'supply_receive') {
          const supplyId = String(activity.details.supplyId);
          const supply = suppliesById.get(supplyId);
          if (supply) { usedSupplyIds.add(supplyId); items.push({ kind: 'accordion', id: `supply-${supplyId}`, type: 'supply', createdAt: ts, data: supply }); }
        } else if (activity.type === 'writeoff_create') {
          const woId = String(activity.details.writeOffId);
          const wo = writeoffsById.get(woId);
          if (wo) { usedWriteoffIds.add(woId); items.push({ kind: 'accordion', id: `writeoff-${woId}`, type: 'writeoff', createdAt: ts, data: wo }); }
        } else {
          items.push({ kind: 'inline', activity, createdAt: ts });
        }
      }

      dailyOrders.forEach((order) => {
        if (!usedOrderIds.has(order.id)) items.push({ kind: 'accordion', id: `order-${order.id}`, type: 'order', createdAt: order.createdAt, data: order });
      });
      dailySupplies.forEach((supply) => {
        if (!usedSupplyIds.has(supply.id)) items.push({ kind: 'accordion', id: `supply-${supply.id}`, type: 'supply', createdAt: supply.createdAt, data: supply });
      });
      dailyWriteoffs.forEach((wo) => {
        if (!usedWriteoffIds.has(wo.id)) items.push({ kind: 'accordion', id: `writeoff-${wo.id}`, type: 'writeoff', createdAt: wo.createdAt, data: wo });
      });

      return items.sort((a, b) => b.createdAt - a.createdAt);
    }

    const items: DailyActivityItem[] = [];
    dailyOrders.forEach((order) => { items.push({ kind: 'accordion', id: `order-${order.id}`, type: 'order', createdAt: order.createdAt, data: order }); });
    dailySupplies.forEach((supply) => { items.push({ kind: 'accordion', id: `supply-${supply.id}`, type: 'supply', createdAt: supply.createdAt, data: supply }); });
    dailyWriteoffs.forEach((wo) => { items.push({ kind: 'accordion', id: `writeoff-${wo.id}`, type: 'writeoff', createdAt: wo.createdAt, data: wo }); });
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [selectedDayReport, dailyOrders, dailySupplies, dailyWriteoffs, ordersById, suppliesById, writeoffsById]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.page}>
      {/* Tab Switcher + Shared Month Nav */}
      <div className={styles.tabBar}>
        <SegmentedControl
          options={TABS_SEGMENTED}
          value={activeTab}
          onChange={setActiveTab}
        />
        <div className={styles.monthNavBar}>
          <Button variant="ghost" size="sm" iconOnly onClick={goToPrevMonth} aria-label="Попередній місяць">
            <Icon name="chevron-left" size="md" />
          </Button>
          <Text variant="labelMedium" weight="semibold" className={styles.monthNavLabel}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={goToNextMonth}
            disabled={isCurrentMonthSelected}
            aria-label="Наступний місяць"
          >
            <Icon name="chevron-right" size="md" />
          </Button>
        </div>
      </div>

      {/* =========== OVERVIEW TAB =========== */}
      {activeTab === 'overview' && (
        <>
          {/* Summary row: stats (left) + top products (right) */}
          <div className={styles.summaryRow}>
            {/* Stats block */}
            <GlassCard className={styles.summaryStats} elevated>
              <div className={styles.summaryStatsRow}>
                <div className={styles.summaryStatsCell}>
                  <Text variant="caption" color="tertiary">Виручка</Text>
                  {isMonthlyLoading ? <Spinner size="sm" /> : (
                    <Text variant="labelLarge" weight="bold" color="success">{'\u20B4'}{formatCurrency(monthRevenue)}</Text>
                  )}
                </div>
                <div className={styles.summaryStatsCell}>
                  <Text variant="caption" color="tertiary">Замовлень</Text>
                  {isMonthlyLoading ? <Spinner size="sm" /> : (
                    <Text variant="labelLarge" weight="bold">{monthOrders}</Text>
                  )}
                </div>
              </div>
              <div className={styles.summaryStatsRow}>
                <div className={styles.summaryStatsCell}>
                  <Text variant="caption" color="tertiary">Сер. чек</Text>
                  {isMonthlyLoading ? <Spinner size="sm" /> : (
                    <Text variant="labelLarge" weight="bold">{'\u20B4'}{formatCurrency(Math.round(monthAvgOrder))}</Text>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Top products */}
            {topProducts.length > 0 && (
              <GlassCard className={styles.topProductsCard} elevated>
                <table className={styles.productsTable}>
                  <thead>
                    <tr>
                      <th>Топ продукти</th>
                      <th>Продано</th>
                      <th>Виторг</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, idx) => (
                      <tr key={product.name}>
                        <td><span className={styles.productRank}>{idx + 1}</span>{product.name}</td>
                        <td>{product.quantity} шт</td>
                        <td>{'\u20B4'}{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
          </div>

          {/* Revenue chart */}
          <GlassCard className={styles.chartSection} elevated>
            <div className={styles.chartTitleRow}>
              <div className={styles.chartTitle}>
                <Icon name="chart" size="sm" color="accent" />
                <Text variant="h5" weight="semibold">Виторг</Text>
              </div>
              <div className={styles.periodToggle}>
                <button
                  className={`${styles.periodBtn} ${chartPeriod === '7d' ? styles.periodBtnActive : ''}`}
                  onClick={() => setChartPeriod('7d')}
                >
                  7д
                </button>
                <button
                  className={`${styles.periodBtn} ${chartPeriod === '30d' ? styles.periodBtnActive : ''}`}
                  onClick={() => setChartPeriod('30d')}
                >
                  30д
                </button>
              </div>
            </div>
            <div className={styles.chartContainer}>
              {isMonthlyLoading ? (
                <div className={styles.loadingState}><Spinner size="md" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartColors.textSecondary }} axisLine={{ stroke: chartColors.gridStroke }} tickLine={false} />
                    <YAxis width={40} tick={{ fontSize: 11, fill: chartColors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={chartColors.brand}
                      strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={{ fill: chartColors.brand, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: chartColors.brand, strokeWidth: 2, stroke: chartColors.white }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* =========== CALENDAR TAB =========== */}
      {activeTab === 'calendar' && (
        <>
          {/* Calendar Header — stats card matching sidebar 2×2 pattern */}
          <div className={styles.calendarStatsCard}>
            <div className={styles.statsSidebarGrid}>
              <div className={styles.statsSidebarCell}>
                <Text variant="caption" color="tertiary">Виручка</Text>
                <Text variant="labelLarge" weight="bold" color="success">₴{formatCurrency(Math.round(monthSummary.totalRevenue))}</Text>
              </div>
              <div className={styles.statsSidebarCell}>
                <Text variant="caption" color="tertiary">Замовлень</Text>
                <Text variant="labelLarge" weight="bold">{monthSummary.totalOrders}</Text>
              </div>
            </div>
            <div className={styles.statsSidebarGrid}>
              <div className={styles.statsSidebarCell}>
                <Text variant="caption" color="tertiary">Сер. чек</Text>
                <Text variant="labelLarge" weight="bold">₴{formatCurrency(Math.round(monthSummary.avgOrder))}</Text>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendar}>
            <div className={styles.weekdays}>
              {WEEKDAYS.map((day) => (
                <div key={day} className={styles.weekday}>
                  <Text variant="labelSmall" color="tertiary" weight="medium">{day}</Text>
                </div>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                const hasData = day.ordersCount > 0 || day.shiftsCount > 0;
                return (
                  <div
                    key={index}
                    className={`${styles.dayCell} ${day.isToday ? styles.today : ''} ${!day.isCurrentMonth ? styles.otherMonth : ''} ${hasData ? styles.hasData : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className={styles.dayNumber}>
                      <Text
                        variant="labelMedium"
                        weight={day.isToday ? 'bold' : 'medium'}
                        color={!day.isCurrentMonth ? 'tertiary' : day.isToday ? 'accent' : 'primary'}
                      >
                        {day.dayNumber}
                      </Text>
                    </div>
                    {hasData && day.isCurrentMonth && (
                      <div className={styles.dayData}>
                        {/* Revenue + orders — 2-col mini grid */}
                        <div className={styles.dayStats}>
                          <Text variant="labelSmall" weight="bold" className={styles.dayRevenue}>₴{formatNumber(day.revenue)}</Text>
                          <Text variant="caption" color="tertiary" className={styles.dayOrders}>{day.ordersCount} зам.</Text>
                        </div>
                        {/* Employee initials */}
                        {day.shiftEmployees.length > 0 && (
                          <div className={styles.dayEmployees}>
                            {day.shiftEmployees.map((name) => (
                              <span key={name} className={styles.employeeChip}>
                                {name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Secondary indicators */}
                        {(day.suppliesTotal > 0 || day.writeOffsTotal > 0) && (
                          <div className={styles.daySecondary}>
                            {day.suppliesTotal > 0 && (
                              <Text variant="caption" color="info" className={styles.daySecondaryItem}>+₴{formatNumber(day.suppliesTotal)}</Text>
                            )}
                            {day.writeOffsTotal > 0 && (
                              <Text variant="caption" color="error" className={styles.daySecondaryItem}>-₴{formatNumber(day.writeOffsTotal)}</Text>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isMonthlyLoading && !monthlyReport && (
            <div className={styles.emptyShifts}>
              <Icon name="chart" size="xl" color="tertiary" />
              <Text variant="bodyMedium" color="secondary">Підключіть бекенд для перегляду звітів</Text>
              <Text variant="bodySmall" color="tertiary">Дані будуть відображатися після створення замовлень</Text>
            </div>
          )}
        </>
      )}

      {/* =========== DAY DETAIL MODAL =========== */}
      <Modal
        isOpen={!!selectedDayKey}
        onClose={handleCloseModal}
        title={selectedDayCell ? `${selectedDayCell.dayNumber} ${MONTHS_SHORT[selectedDayCell.date.getMonth()]} ${selectedDayCell.date.getFullYear()}` : ''}
        subtitle={selectedDayCell?.date.toLocaleDateString('uk-UA', { weekday: 'long' })}
        icon="calendar"
        size="full"
      >
        {selectedDayCell && (
          <div className={styles.modalContent}>
            {isDayLoading ? (
              <div className={styles.emptyShifts}>
                <Spinner size="md" />
                <Text variant="bodyMedium" color="secondary">Завантаження...</Text>
              </div>
            ) : (
              <>
                {/* ── Two-column body: activities (left) + stats sidebar (right) ── */}
                <div className={styles.modalBody}>
                  {/* Activity list — left column */}
                  <div className={styles.activityList}>
                    <div className={styles.activityListHeader}>
                      <Text variant="labelMedium" weight="semibold">Дії ({dailyActivities.length})</Text>
                    </div>
                    {dailyActivities.length === 0 ? (
                      <div className={styles.emptyActivity}>
                        <Text variant="bodySmall" color="tertiary">Немає записів</Text>
                      </div>
                    ) : (
                      <div className={styles.activityItems}>
                        {dailyActivities.map((item) => {
                          if (item.kind === 'inline') {
                            return <ActivityInline key={item.activity.id} type={item.activity.type} timestamp={item.activity.timestamp} details={item.activity.details} />;
                          }
                          if (item.type === 'order') {
                            const order = item.data as OrderData;
                            const total = order.items.reduce((s, i) => {
                              const mods = (i.modifiers || []).reduce((m: number, mod: {price: number}) => m + mod.price, 0);
                              return s + (i.price + mods) * i.quantity;
                            }, 0);
                            return (
                              <OrderCard
                                key={item.id}
                                createdAt={order.createdAt}
                                orderId={order.id}
                                items={order.items}
                                total={total}
                                paymentMethod={order.paymentMethod}
                                onClick={() => setSelectedDetail(item)}
                              />
                            );
                          }
                          const time = new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                          if (item.type === 'supply') {
                            const supply = item.data as SupplyAccordionData;
                            const preview = supply.items.map((i) => i.name).join(', ');
                            return (
                              <button key={item.id} className={styles.activityRow} onClick={() => setSelectedDetail(item)}>
                                <span className={styles.activityRowIcon}>
                                  <Icon name="truck" size="sm" color="secondary" />
                                </span>
                                <div className={styles.activityRowBody}>
                                  <div className={styles.activityRowMeta}>
                                    <Text variant="labelSmall" weight="semibold">{time}</Text>
                                    <Text variant="caption" color="tertiary">{supply.supplierName}</Text>
                                  </div>
                                  <Text variant="bodySmall" color="secondary" className={styles.activityRowPreview}>{preview || '—'}</Text>
                                </div>
                                <Text variant="labelMedium" weight="bold">₴{formatCurrency(Math.round(supply.totalCost))}</Text>
                              </button>
                            );
                          }
                          const wo = item.data as WriteoffAccordionData;
                          const typeLabel: Record<string, string> = { expired: 'Прострочено', damaged: 'Пошкоджено', other: 'Інше' };
                          const woPreview = wo.items.map((i) => i.name).join(', ');
                          return (
                            <button key={item.id} className={styles.activityRow} onClick={() => setSelectedDetail(item)}>
                              <span className={styles.activityRowIcon}>
                                <Icon name="delete" size="sm" color="error" />
                              </span>
                              <div className={styles.activityRowBody}>
                                <div className={styles.activityRowMeta}>
                                  <Text variant="labelSmall" weight="semibold">{time}</Text>
                                  <Text variant="caption" color="tertiary">{typeLabel[wo.type] || wo.type}</Text>
                                </div>
                                <Text variant="bodySmall" color="secondary" className={styles.activityRowPreview}>{woPreview || '—'}</Text>
                              </div>
                              <Text variant="labelMedium" weight="bold" color="error">-₴{formatCurrency(Math.round(wo.totalCost))}</Text>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Stats sidebar — right column */}
                  <div className={styles.statsSidebar}>
                    {/* Shift info */}
                    {(selectedDayReport?.shifts?.length ?? 0) > 0 && (
                      <div className={styles.statsSidebarShift}>
                        <Text variant="caption" color="tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Зміна</Text>
                        {selectedDayReport!.shifts.map((shift: any) => {
                          const startTime = shift.openedAt
                            ? new Date(shift.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
                            : '—';
                          const endTime = shift.closedAt
                            ? new Date(shift.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
                            : 'зараз';
                          return (
                            <div key={shift.id || shift.documentId} className={styles.statsSidebarShiftRow}>
                              <Icon name="user" size="sm" color="tertiary" />
                              <div>
                                <Text variant="bodySmall" weight="semibold">{shift.openedBy || '—'}</Text>
                                <Text variant="caption" color="tertiary">{startTime}–{endTime}</Text>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Stats rows — 2×2 grid pairs */}
                    <div className={styles.statsSidebarGrid}>
                      <div className={styles.statsSidebarCell}>
                        <Text variant="caption" color="tertiary">Виручка</Text>
                        <Text variant="labelLarge" weight="bold">₴{formatCurrency(Math.round(selectedDayCell.revenue))}</Text>
                      </div>
                      <div className={styles.statsSidebarCell}>
                        <Text variant="caption" color="tertiary">Замовлень</Text>
                        <Text variant="labelLarge" weight="bold">{dailyOrders.length}</Text>
                      </div>
                    </div>
                    <div className={styles.statsSidebarGrid}>
                      <div className={styles.statsSidebarCell}>
                        <Text variant="caption" color="tertiary">Готівка</Text>
                        <Text variant="labelMedium" weight="semibold">₴{formatCurrency(Math.round(selectedDayCell.cashSales))}</Text>
                      </div>
                      <div className={styles.statsSidebarCell}>
                        <Text variant="caption" color="tertiary">Картка</Text>
                        <Text variant="labelMedium" weight="semibold">₴{formatCurrency(Math.round(selectedDayCell.cardSales))}</Text>
                      </div>
                    </div>
                    {selectedDayCell.writeOffsTotal > 0 && (
                      <div className={styles.statsSidebarRow}>
                        <Text variant="caption" color="tertiary">Списання</Text>
                        <Text variant="labelMedium" weight="semibold" color="error">-₴{formatCurrency(Math.round(selectedDayCell.writeOffsTotal))}</Text>
                      </div>
                    )}
                    {selectedDayCell.suppliesTotal > 0 && (
                      <div className={styles.statsSidebarRow}>
                        <Text variant="caption" color="tertiary">Поставки</Text>
                        <Text variant="labelMedium" weight="semibold">₴{formatCurrency(Math.round(selectedDayCell.suppliesTotal))}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* =========== ACTIVITY DETAIL MODAL =========== */}
      {selectedDetail && selectedDetail.kind === 'accordion' && (() => {
        const item = selectedDetail;
        const time = new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

        if (item.type === 'order') {
          const order = item.data as OrderData;
          const total = order.items.reduce((s, i) => {
            const mods = (i.modifiers || []).reduce((m: number, mod: {price: number}) => m + mod.price, 0);
            return s + (i.price + mods) * i.quantity;
          }, 0);
          return (
            <Modal
              isOpen
              onClose={() => setSelectedDetail(null)}
              title={`Замовлення · ${time}`}
              icon="receipt"
              size="sm"
            >
              <div className={styles.detailContent}>
                <div className={styles.detailTable}>
                  <div className={styles.detailTableHead}>
                    <Text variant="caption" color="tertiary">Позиція</Text>
                    <Text variant="caption" color="tertiary" className={styles.colRight}>К-сть</Text>
                    <Text variant="caption" color="tertiary" className={styles.colRight}>Сума</Text>
                  </div>
                  {order.items.map((itm, idx) => {
                    const mods = (itm.modifiers || []).reduce((m: number, mod: {price: number}) => m + mod.price, 0);
                    const rowTotal = (itm.price + mods) * itm.quantity;
                    return (
                      <div key={idx} className={styles.detailRow}>
                        <div>
                          <Text variant="bodySmall">{itm.name}</Text>
                          {(itm.modifiers || []).length > 0 && (
                            <div className={styles.detailMods}>
                              {(itm.modifiers || []).map((mod: {name: string; price: number}, midx: number) => (
                                <Text key={midx} variant="caption" color="tertiary">
                                  + {mod.name}{mod.price > 0 && ` (₴${mod.price})`}
                                </Text>
                              ))}
                            </div>
                          )}
                        </div>
                        <Text variant="bodySmall" color="secondary" className={styles.colRight}>{itm.quantity}×</Text>
                        <Text variant="bodySmall" weight="semibold" className={styles.colRight}>₴{rowTotal.toFixed(0)}</Text>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.detailFooter}>
                  <Text variant="labelMedium" color="secondary">Всього</Text>
                  <Text variant="h4" weight="bold">₴{formatCurrency(Math.round(total))}</Text>
                </div>
              </div>
            </Modal>
          );
        }

        if (item.type === 'supply') {
          const supply = item.data as SupplyAccordionData;
          return (
            <Modal
              isOpen
              onClose={() => setSelectedDetail(null)}
              title={`Поставка · ${time}`}
              icon="truck"
              size="sm"
            >
              <div className={styles.detailContent}>
                <div className={styles.detailMeta}>
                  <Text variant="bodySmall" color="secondary">{supply.supplierName}</Text>
                </div>
                <div className={styles.detailTable}>
                  <div className={styles.detailTableHead}>
                    <Text variant="caption" color="tertiary">Інгредієнт</Text>
                    <Text variant="caption" color="tertiary" className={styles.colRight}>К-сть</Text>
                    <Text variant="caption" color="tertiary" className={styles.colRight}>Сума</Text>
                  </div>
                  {supply.items.map((itm, idx) => (
                    <div key={idx} className={styles.detailRow}>
                      <Text variant="bodySmall">{itm.name}</Text>
                      <Text variant="bodySmall" color="secondary" className={styles.colRight}>{itm.quantity}</Text>
                      <Text variant="bodySmall" weight="semibold" className={styles.colRight}>₴{itm.totalCost.toFixed(0)}</Text>
                    </div>
                  ))}
                </div>
                <div className={styles.detailFooter}>
                  <Text variant="labelMedium" color="secondary">Всього</Text>
                  <Text variant="h4" weight="bold">₴{formatCurrency(Math.round(supply.totalCost))}</Text>
                </div>
              </div>
            </Modal>
          );
        }

        if (item.type === 'writeoff') {
          const wo = item.data as WriteoffAccordionData;
          const typeLabel: Record<string, string> = { expired: 'Прострочено', damaged: 'Пошкоджено', other: 'Інше' };
          return (
            <Modal
              isOpen
              onClose={() => setSelectedDetail(null)}
              title={`Списання · ${time}`}
              icon="delete"
              size="sm"
            >
              <div className={styles.detailContent}>
                <div className={styles.detailMeta}>
                  <Text variant="bodySmall" color="secondary">{typeLabel[wo.type] || wo.type}</Text>
                  {wo.reason && <Text variant="caption" color="tertiary">{wo.reason}</Text>}
                  {wo.performedBy && <Text variant="caption" color="tertiary">{wo.performedBy}</Text>}
                </div>
                <div className={styles.detailTable}>
                  <div className={styles.detailTableHead}>
                    <Text variant="caption" color="tertiary">Інгредієнт</Text>
                    <Text variant="caption" color="tertiary" className={styles.colRight}>К-сть</Text>
                    <Text variant="caption" color="tertiary" className={styles.colRight}>Сума</Text>
                  </div>
                  {wo.items.map((itm, idx) => (
                    <div key={idx} className={styles.detailRow}>
                      <Text variant="bodySmall">{itm.name}</Text>
                      <Text variant="bodySmall" color="secondary" className={styles.colRight}>{itm.quantity}</Text>
                      <Text variant="bodySmall" weight="semibold" color="error" className={styles.colRight}>-₴{itm.totalCost.toFixed(0)}</Text>
                    </div>
                  ))}
                </div>
                <div className={styles.detailFooter}>
                  <Text variant="labelMedium" color="secondary">Всього</Text>
                  <Text variant="h4" weight="bold" color="error">-₴{formatCurrency(Math.round(wo.totalCost))}</Text>
                </div>
              </div>
            </Modal>
          );
        }
        return null;
      })()}

    </div>
  );
}
