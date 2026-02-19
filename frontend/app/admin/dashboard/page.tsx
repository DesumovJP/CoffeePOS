'use client';

/**
 * CoffeePOS - Analytics Page (Аналітика)
 *
 * Merged Dashboard + Reports into a single page with two tabs:
 * - Огляд: Stats cards, 7-day revenue chart, payment pie, top products, recent orders
 * - Календар: Calendar grid with day/shift detail modals and activity logs
 */

import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Text, Icon, GlassCard, Badge, Spinner, Button, Modal } from '@/components/atoms';
import { CategoryTabs, OrderAccordion, SupplyAccordion, WriteoffAccordion, ActivityInline } from '@/components/molecules';
import type { OrderData, SupplyAccordionData, WriteoffAccordionData } from '@/components/molecules';
import { useDailyReport, useMonthlyReport, useCurrentShift } from '@/lib/hooks';
import type { MonthlyDayData, ShiftActivity } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// TABS
// ============================================

const TABS = [
  { id: 'overview', name: 'Огляд' },
  { id: 'calendar', name: 'Календар' },
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

const PAYMENT_COLORS_FALLBACK = ['#30B350', '#007AFF', '#FF9500', '#A0A0A0'];
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Готівка',
  card: 'Картка',
  qr: 'QR',
  other: 'Інше',
};

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
  shiftsCount: number;
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

  // ---- Chart colors (read from CSS vars) ----
  const [chartColors, setChartColors] = useState({
    brand: '#8B5E3C',
    success: '#30B350',
    info: '#007AFF',
    warning: '#FF9500',
    neutral: '#A0A0A0',
    textSecondary: '#787880',
    gridStroke: 'rgba(0,0,0,0.06)',
    white: '#ffffff',
    paymentColors: PAYMENT_COLORS_FALLBACK,
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string) => cs.getPropertyValue(v).trim();
    setChartColors({
      brand: get('--color-accent-600') || '#8B5E3C',
      success: get('--color-success') || '#30B350',
      info: get('--color-info') || '#007AFF',
      warning: get('--color-warning') || '#FF9500',
      neutral: get('--color-neutral-400') || '#A0A0A0',
      textSecondary: get('--text-secondary') || '#787880',
      gridStroke: get('--glass-border') || 'rgba(0,0,0,0.06)',
      white: get('--color-neutral-0') || '#ffffff',
      paymentColors: [
        get('--color-success') || '#30B350',
        get('--color-info') || '#007AFF',
        get('--color-warning') || '#FF9500',
        get('--color-neutral-400') || '#A0A0A0',
      ],
    });
  }, []);

  const today = new Date();
  const todayKey = getTodayKey();

  // ============================================
  // OVERVIEW TAB DATA
  // ============================================

  const { data: todayReport, isLoading: isTodayLoading } = useDailyReport(todayKey);
  const { data: overviewMonthly, isLoading: isOverviewMonthlyLoading } = useMonthlyReport(
    today.getFullYear(),
    today.getMonth() + 1
  );
  const { data: currentShift } = useCurrentShift();

  const todayRevenue = todayReport?.summary?.totalRevenue || 0;
  const todayOrders = todayReport?.summary?.ordersCount || 0;
  const todayAvgOrder = todayReport?.summary?.avgOrder || 0;
  const activeShifts = currentShift && currentShift.status === 'open' ? 1 : 0;

  const revenueChartData = useMemo(() => {
    if (!overviewMonthly?.days) return [];
    const todayDate = new Date();
    const last7Days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayData = overviewMonthly.days.find((day) => day.date === key);
      last7Days.push({ date: getShortDate(key), revenue: dayData?.revenue || 0 });
    }
    return last7Days;
  }, [overviewMonthly]);

  const paymentPieData = useMemo(() => {
    if (!todayReport?.paymentBreakdown) {
      return [
        { name: 'Готівка', value: 35, key: 'cash' },
        { name: 'Картка', value: 55, key: 'card' },
        { name: 'QR', value: 10, key: 'qr' },
      ];
    }
    const { cash, card, qr, other } = todayReport.paymentBreakdown;
    const data = [];
    if (cash > 0) data.push({ name: PAYMENT_LABELS.cash, value: cash, key: 'cash' });
    if (card > 0) data.push({ name: PAYMENT_LABELS.card, value: card, key: 'card' });
    if (qr > 0) data.push({ name: PAYMENT_LABELS.qr, value: qr, key: 'qr' });
    if (other > 0) data.push({ name: PAYMENT_LABELS.other, value: other, key: 'other' });
    return data.length > 0
      ? data
      : [{ name: 'Немає даних', value: 1, key: 'none' }];
  }, [todayReport]);

  const topProducts = useMemo(() => {
    return (todayReport?.topProducts || []).slice(0, 5);
  }, [todayReport]);

  const recentOrders = useMemo(() => {
    if (!todayReport?.orders) return [];
    return todayReport.orders.slice(0, 5).map((order: any) => ({
      id: order.id || order.documentId,
      number: order.orderNumber || order.number || `#${order.id}`,
      time: order.createdAt
        ? new Date(order.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        : '--:--',
      total: parseFloat(order.total) || 0,
      status: order.status || 'completed',
    }));
  }, [todayReport]);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success' as const;
      case 'preparing': return 'warning' as const;
      case 'cancelled': return 'error' as const;
      case 'pending': return 'default' as const;
      default: return 'default' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Готово';
      case 'preparing': return 'Готується';
      case 'cancelled': return 'Скасовано';
      case 'pending': return 'Очікує';
      default: return status;
    }
  };

  const overviewLoading = isTodayLoading || isOverviewMonthlyLoading;

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

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayCell, setSelectedDayCell] = useState<DayCell | null>(null);
  const [expandedAccordionId, setExpandedAccordionId] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftExpandedAccordionId, setShiftExpandedAccordionId] = useState<string | null>(null);

  const { data: calendarMonthly, isLoading: isCalendarMonthlyLoading } = useMonthlyReport(currentYear, currentMonth + 1);
  const { data: selectedDayReport, isLoading: isDayLoading } = useDailyReport(selectedDayKey || '');

  const dayDataMap = useMemo(() => {
    const map = new Map<string, MonthlyDayData>();
    if (calendarMonthly?.days) {
      calendarMonthly.days.forEach((day) => map.set(day.date, day));
    }
    return map;
  }, [calendarMonthly]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const calendarDays = useMemo((): DayCell[] => {
    const days = getCalendarDays(currentYear, currentMonth);
    const todayKeyLocal = getDateKey(today);
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
        shiftsCount: apiData?.shiftsCount || 0,
      };
    });
  }, [currentMonth, currentYear, today, dayDataMap]);

  const monthSummary = useMemo(() => {
    if (calendarMonthly?.summary) {
      return {
        totalRevenue: calendarMonthly.summary.totalRevenue,
        totalOrders: calendarMonthly.summary.totalOrders,
        avgOrder: calendarMonthly.summary.avgOrder,
      };
    }
    const monthDays = calendarDays.filter(d => d.isCurrentMonth);
    const totalRevenue = monthDays.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = monthDays.reduce((sum, day) => sum + day.ordersCount, 0);
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrder };
  }, [calendarMonthly, calendarDays]);

  const handleDayClick = (day: DayCell) => {
    if (day.ordersCount > 0 || day.shiftsCount > 0) {
      setSelectedDayKey(day.dateKey);
      setSelectedDayCell(day);
      setExpandedAccordionId(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedDayKey(null);
    setSelectedDayCell(null);
    setExpandedAccordionId(null);
    setSelectedShiftId(null);
    setShiftExpandedAccordionId(null);
  };

  const toggleAccordion = (id: string) => {
    setExpandedAccordionId(expandedAccordionId === id ? null : id);
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

  const dailyShifts = useMemo(() => {
    if (!selectedDayReport?.shifts) return [];
    return selectedDayReport.shifts.map((shift: any) => ({
      id: String(shift.id || shift.documentId),
      documentId: shift.documentId || String(shift.id),
      employee: shift.openedBy || '—',
      closedBy: shift.closedBy,
      openingCash: shift.openingCash || 0,
      closingCash: shift.closingCash || 0,
      cashSales: shift.cashSales || 0,
      cardSales: shift.cardSales || 0,
      totalSales: (shift.cashSales || 0) + (shift.cardSales || 0),
      ordersCount: shift.ordersCount || 0,
      suppliesTotal: shift.suppliesTotal || 0,
      writeOffs: shift.writeOffsTotal || 0,
      startTime: shift.openedAt ? new Date(shift.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—',
      endTime: shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—',
      openedAtRaw: shift.openedAt ? new Date(shift.openedAt).getTime() : 0,
      closedAtRaw: shift.closedAt ? new Date(shift.closedAt).getTime() : 0,
      status: shift.status,
      difference: (shift.closingCash || 0) - ((shift.openingCash || 0) + (shift.cashSales || 0)),
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

  const selectedShift = dailyShifts.find(s => s.documentId === selectedShiftId) || null;

  const shiftActivities = useMemo((): DailyActivityItem[] => {
    if (!selectedShift) return [];
    const start = selectedShift.openedAtRaw;
    const end = selectedShift.closedAtRaw || Date.now();
    return dailyActivities.filter(item => item.createdAt >= start && item.createdAt <= end);
  }, [selectedShift, dailyActivities]);

  const shiftDuration = useMemo(() => {
    if (!selectedShift || !selectedShift.openedAtRaw) return '';
    const end = selectedShift.closedAtRaw || Date.now();
    const diffMs = end - selectedShift.openedAtRaw;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0 && minutes > 0) return `${hours}г ${minutes}хв`;
    if (hours > 0) return `${hours}г`;
    return `${minutes}хв`;
  }, [selectedShift]);

  const toggleShiftAccordion = (id: string) => {
    setShiftExpandedAccordionId(shiftExpandedAccordionId === id ? null : id);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.page}>
      {/* Tab Switcher */}
      <div className={styles.toolbar}>
        <CategoryTabs
          categories={TABS}
          value={activeTab}
          showAll={false}
          onChange={(id) => setActiveTab(id || 'overview')}
          size="md"
        />
      </div>

      {/* =========== OVERVIEW TAB =========== */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Row */}
          <div className={styles.statsRow}>
            <GlassCard className={styles.statCard} elevated>
              <div className={styles.statHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconSuccess}`}>
                  <Icon name="cash" size="sm" color="success" />
                </div>
                <Text variant="labelSmall" color="tertiary">Виторг сьогодні</Text>
              </div>
              {overviewLoading ? <Spinner size="sm" /> : (
                <div className={styles.statValue}>{'\u20B4'}{formatCurrency(todayRevenue)}</div>
              )}
            </GlassCard>

            <GlassCard className={styles.statCard} elevated>
              <div className={styles.statHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconAccent}`}>
                  <Icon name="receipt" size="sm" color="accent" />
                </div>
                <Text variant="labelSmall" color="tertiary">Замовлень сьогодні</Text>
              </div>
              {overviewLoading ? <Spinner size="sm" /> : (
                <div className={styles.statValue}>{todayOrders}</div>
              )}
            </GlassCard>

            <GlassCard className={styles.statCard} elevated>
              <div className={styles.statHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconInfo}`}>
                  <Icon name="chart" size="sm" color="info" />
                </div>
                <Text variant="labelSmall" color="tertiary">Середній чек</Text>
              </div>
              {overviewLoading ? <Spinner size="sm" /> : (
                <div className={styles.statValue}>{'\u20B4'}{formatCurrency(Math.round(todayAvgOrder))}</div>
              )}
            </GlassCard>

            <GlassCard className={styles.statCard} elevated>
              <div className={styles.statHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconWarning}`}>
                  <Icon name="clock" size="sm" color="warning" />
                </div>
                <Text variant="labelSmall" color="tertiary">Активних змін</Text>
              </div>
              <div className={styles.statValue}>{activeShifts}</div>
            </GlassCard>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsRow}>
            <GlassCard className={styles.chartSection} elevated>
              <div className={styles.chartTitle}>
                <Icon name="chart" size="sm" color="accent" />
                <Text variant="h5" weight="semibold">Виторг за 7 днів</Text>
              </div>
              <div className={styles.chartContainer}>
                {isOverviewMonthlyLoading ? (
                  <div className={styles.loadingState}><Spinner size="md" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartColors.textSecondary }} axisLine={{ stroke: chartColors.gridStroke }} tickLine={false} />
                      <YAxis width={40} tick={{ fontSize: 11, fill: chartColors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" stroke={chartColors.brand} strokeWidth={2.5} dot={{ fill: chartColors.brand, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: chartColors.brand, strokeWidth: 2, stroke: chartColors.white }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>

            <GlassCard className={styles.chartSection} elevated>
              <div className={styles.chartTitle}>
                <Icon name="card" size="sm" color="info" />
                <Text variant="h5" weight="semibold">Оплата сьогодні</Text>
              </div>
              <div className={styles.pieChartContainer}>
                {isTodayLoading ? <Spinner size="md" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {paymentPieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors.paymentColors[index % chartColors.paymentColors.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(value: string) => <span className={styles.legendText}>{value}</span>} />
                      <Tooltip formatter={(value: number | undefined) => [`\u20B4${formatCurrency(value || 0)}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Bottom Row: Top Products + Recent Orders */}
          <div className={styles.bottomRow}>
            <GlassCard className={styles.tableSection} elevated>
              <div className={styles.tableTitle}>
                <Icon name="star" size="sm" color="warning" />
                <Text variant="h5" weight="semibold">Топ продукти</Text>
              </div>
              {isTodayLoading ? (
                <div className={styles.loadingState}><Spinner size="md" /></div>
              ) : topProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="package" size="xl" color="tertiary" />
                  <Text variant="bodySmall" color="tertiary">Немає даних за сьогодні</Text>
                </div>
              ) : (
                <table className={styles.productsTable}>
                  <thead>
                    <tr><th>Назва</th><th>Кількість</th><th>Виторг</th></tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, idx) => (
                      <tr key={product.name}>
                        <td><span className={styles.productRank}>{idx + 1}</span>{product.name}</td>
                        <td>{product.quantity} шт.</td>
                        <td>{'\u20B4'}{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassCard>

            <GlassCard className={styles.tableSection} elevated>
              <div className={styles.tableTitle}>
                <Icon name="receipt" size="sm" color="accent" />
                <Text variant="h5" weight="semibold">Останні замовлення</Text>
              </div>
              {isTodayLoading ? (
                <div className={styles.loadingState}><Spinner size="md" /></div>
              ) : recentOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="receipt" size="xl" color="tertiary" />
                  <Text variant="bodySmall" color="tertiary">Немає замовлень за сьогодні</Text>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {recentOrders.map((order) => (
                    <div key={order.id} className={styles.orderItem}>
                      <div className={styles.orderLeft}>
                        <span className={styles.orderNumber}>{order.number}</span>
                        <span className={styles.orderTime}>{order.time}</span>
                      </div>
                      <div className={styles.orderRight}>
                        <span className={styles.orderTotal}>{'\u20B4'}{formatCurrency(order.total)}</span>
                        <Badge variant={statusVariant(order.status)} size="sm">{statusLabel(order.status)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}

      {/* =========== CALENDAR TAB =========== */}
      {activeTab === 'calendar' && (
        <>
          {/* Calendar Header */}
          <div className={styles.calendarHeader}>
            <div className={styles.headerStats}>
              <div className={styles.statPill}>
                <Icon name="cash" size="sm" color="success" />
                <Text variant="labelMedium" weight="semibold">₴{formatNumber(monthSummary.totalRevenue)}</Text>
              </div>
              <div className={styles.statPill}>
                <Icon name="receipt" size="sm" color="accent" />
                <Text variant="labelMedium" weight="semibold">{monthSummary.totalOrders}</Text>
              </div>
            </div>

            <div className={styles.monthNav}>
              <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                <Icon name="chevron-left" size="md" />
              </Button>
              <div className={styles.monthTitle}>
                <Text variant="h4" weight="semibold">{MONTHS[currentMonth]} {currentYear}</Text>
              </div>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <Icon name="chevron-right" size="md" />
              </Button>
            </div>

            <div className={styles.headerStats}>
              <div className={styles.statPill}>
                <Icon name="chart" size="sm" color="info" />
                <Text variant="labelMedium" weight="semibold">₴{monthSummary.avgOrder.toFixed(0)}</Text>
                <Text variant="caption" color="tertiary">сер.</Text>
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
                        <div className={styles.dayIndicator}>
                          <span className={`${styles.dayIndicatorDot} ${styles.dotSuccess}`} />
                          <Text variant="labelSmall" weight="semibold" color="accent">₴{formatNumber(day.revenue)}</Text>
                        </div>
                        {day.writeOffsTotal > 0 && (
                          <div className={styles.dayIndicator}>
                            <span className={`${styles.dayIndicatorDot} ${styles.dotError}`} />
                            <Text variant="labelSmall" weight="semibold" color="error">-₴{formatNumber(day.writeOffsTotal)}</Text>
                          </div>
                        )}
                        <Text variant="caption" color="tertiary">{day.ordersCount} зам.</Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isCalendarMonthlyLoading && !calendarMonthly && (
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
        size="lg"
      >
        {selectedDayCell && (
          <div className={styles.modalContent}>
            {isDayLoading ? (
              <div className={styles.emptyShifts}>
                <Text variant="bodyMedium" color="secondary">Завантаження...</Text>
              </div>
            ) : (
              <>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">ВИРУЧКА</Text>
                      <Text variant="caption" weight="semibold" color="success">{dailyOrders.length} зам.</Text>
                    </div>
                    <Text variant="h3" weight="bold">
                      {Math.round(selectedDayCell.revenue).toLocaleString()}
                      <span className={styles.currencySmall}>₴</span>
                    </Text>
                    <Text variant="caption" color="tertiary">
                      сер. чек {dailyOrders.length > 0 ? Math.round(selectedDayCell.revenue / dailyOrders.length) : 0} ₴
                    </Text>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">КАСА</Text>
                    </div>
                    <div className={styles.summaryCardRow}>
                      <div className={styles.summaryCardDetail}>
                        <Icon name="cash" size="sm" color="success" />
                        <Text variant="bodySmall" color="secondary">Готівка</Text>
                        <Text variant="labelMedium" weight="bold">₴{Math.round(selectedDayCell.cashSales)}</Text>
                      </div>
                      <div className={styles.summaryCardDetail}>
                        <Icon name="card" size="sm" color="info" />
                        <Text variant="bodySmall" color="secondary">Картка</Text>
                        <Text variant="labelMedium" weight="bold">₴{Math.round(selectedDayCell.cardSales)}</Text>
                      </div>
                    </div>
                    {dailyShifts.some(s => s.difference !== 0) && (
                      <Text variant="caption" weight="semibold" color={dailyShifts.reduce((s, sh) => s + sh.difference, 0) >= 0 ? 'success' : 'error'}>
                        Різниця {dailyShifts.reduce((s, sh) => s + sh.difference, 0) > 0 ? '+' : ''}₴{Math.round(dailyShifts.reduce((s, sh) => s + sh.difference, 0))}
                      </Text>
                    )}
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">СПИСАННЯ</Text>
                      <Text variant="caption" weight="semibold" color="warning">{dailyWriteoffs.length} оп.</Text>
                    </div>
                    <Text variant="h3" weight="bold">
                      {Math.round(dailyWriteoffs.reduce((s, w) => s + w.totalCost, 0)).toLocaleString()}
                      <span className={styles.currencySmall}>₴</span>
                    </Text>
                    <Text variant="caption" color="tertiary">{dailyWriteoffs.reduce((s, w) => s + w.items.length, 0)} позицій</Text>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">ПОСТАВКИ</Text>
                      <Text variant="caption" weight="semibold" color="info">{dailySupplies.length} оп.</Text>
                    </div>
                    <Text variant="h3" weight="bold">
                      {Math.round(dailySupplies.reduce((s, sp) => s + sp.totalCost, 0)).toLocaleString()}
                      <span className={styles.currencySmall}>₴</span>
                    </Text>
                    <Text variant="caption" color="tertiary">{dailySupplies.reduce((s, sp) => s + sp.items.length, 0)} позицій</Text>
                  </div>
                </div>

                {dailyShifts.length > 0 && dailyShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`${styles.shiftCard} ${shift.status === 'open' ? styles.shiftCardOpen : ''}`}
                    onClick={() => { setSelectedShiftId(shift.documentId); setShiftExpandedAccordionId(null); }}
                  >
                    <div className={styles.shiftCardTop}>
                      <div className={styles.shiftCardTime}>
                        <Icon name="clock" size="sm" color="tertiary" />
                        <Text variant="labelMedium" weight="semibold">
                          Зміна {shift.startTime} — {shift.status === 'open' ? 'зараз' : shift.endTime}
                        </Text>
                      </div>
                      <span className={`${styles.shiftStatusBadge} ${shift.status === 'open' ? styles.shiftStatusOpen : styles.shiftStatusClosed}`}>
                        {shift.status === 'open' ? 'Відкрита' : 'Закрита'}
                      </span>
                    </div>
                    <div className={styles.shiftCardBottom}>
                      <span className={styles.shiftCardStat}>
                        <Text variant="bodySmall" color="secondary">Продажі</Text>
                        <Text variant="labelSmall" weight="semibold">₴{Math.round(shift.totalSales).toLocaleString()}</Text>
                      </span>
                      <span className={styles.shiftCardStat}>
                        <Text variant="bodySmall" color="secondary">{shift.ordersCount} зам.</Text>
                      </span>
                      <span className={styles.shiftCardStat}>
                        <Text variant="bodySmall" color="secondary">{shift.employee}</Text>
                      </span>
                      {shift.difference !== 0 && (
                        <span className={styles.shiftCardStat}>
                          <Text variant="labelSmall" weight="semibold" color={shift.difference >= 0 ? 'success' : 'error'}>
                            {shift.difference > 0 ? '+' : ''}₴{Math.round(shift.difference)}
                          </Text>
                        </span>
                      )}
                      <span className={styles.shiftCardArrow}>
                        <Icon name="chevron-right" size="sm" color="tertiary" />
                      </span>
                    </div>
                  </div>
                ))}

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
                        const isExpanded = expandedAccordionId === item.id;
                        if (item.type === 'order') return <OrderAccordion key={item.id} order={item.data as OrderData} isExpanded={isExpanded} onToggle={() => toggleAccordion(item.id)} />;
                        if (item.type === 'supply') return <SupplyAccordion key={item.id} supply={item.data as SupplyAccordionData} isExpanded={isExpanded} onToggle={() => toggleAccordion(item.id)} />;
                        return <WriteoffAccordion key={item.id} writeoff={item.data as WriteoffAccordionData} isExpanded={isExpanded} onToggle={() => toggleAccordion(item.id)} />;
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* =========== SHIFT DETAIL MODAL =========== */}
      <Modal
        isOpen={!!selectedShiftId && !!selectedShift}
        onClose={() => { setSelectedShiftId(null); setShiftExpandedAccordionId(null); }}
        title={selectedShift ? `Зміна ${selectedShift.startTime} — ${selectedShift.status === 'open' ? 'зараз' : selectedShift.endTime}` : ''}
        subtitle={selectedShift ? `${selectedShift.employee}${selectedShift.closedBy && selectedShift.closedBy !== selectedShift.employee ? ` → ${selectedShift.closedBy}` : ''} • ${shiftDuration}` : ''}
        icon="clock"
        size="lg"
      >
        {selectedShift && (
          <div className={styles.modalContent}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <Text variant="caption" weight="semibold" color="tertiary">ПРОДАЖІ</Text>
                  <Text variant="caption" weight="semibold" color="success">{selectedShift.ordersCount} зам.</Text>
                </div>
                <Text variant="h3" weight="bold">
                  {Math.round(selectedShift.totalSales).toLocaleString()}
                  <span className={styles.currencySmall}>₴</span>
                </Text>
                <div className={styles.summaryCardRow}>
                  <div className={styles.summaryCardDetail}>
                    <Icon name="cash" size="sm" color="success" />
                    <Text variant="bodySmall" color="secondary">Готівка</Text>
                    <Text variant="labelMedium" weight="bold">₴{Math.round(selectedShift.cashSales)}</Text>
                  </div>
                  <div className={styles.summaryCardDetail}>
                    <Icon name="card" size="sm" color="info" />
                    <Text variant="bodySmall" color="secondary">Картка</Text>
                    <Text variant="labelMedium" weight="bold">₴{Math.round(selectedShift.cardSales)}</Text>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <Text variant="caption" weight="semibold" color="tertiary">КАСА</Text>
                </div>
                <div className={styles.shiftCashFlow}>
                  <div className={styles.shiftCashRow}>
                    <Text variant="bodySmall" color="secondary">Відкриття</Text>
                    <Text variant="labelMedium" weight="semibold">₴{Math.round(selectedShift.openingCash)}</Text>
                  </div>
                  <div className={styles.shiftCashRow}>
                    <Text variant="bodySmall" color="secondary">Очікувана</Text>
                    <Text variant="labelMedium" weight="semibold">₴{Math.round(selectedShift.openingCash + selectedShift.cashSales)}</Text>
                  </div>
                  {selectedShift.status !== 'open' && (
                    <>
                      <div className={styles.shiftCashDivider} />
                      <div className={styles.shiftCashRow}>
                        <Text variant="bodySmall" color="secondary">Закриття</Text>
                        <Text variant="labelMedium" weight="semibold">₴{Math.round(selectedShift.closingCash)}</Text>
                      </div>
                      <div className={styles.shiftCashRow}>
                        <Text variant="bodySmall" color={selectedShift.difference >= 0 ? 'success' : 'error'}>Різниця</Text>
                        <Text variant="labelMedium" weight="bold" color={selectedShift.difference >= 0 ? 'success' : 'error'}>
                          {selectedShift.difference > 0 ? '+' : ''}₴{Math.round(selectedShift.difference)}
                        </Text>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <Text variant="caption" weight="semibold" color="tertiary">СПИСАННЯ</Text>
                </div>
                <Text variant="h3" weight="bold">
                  {Math.round(selectedShift.writeOffs).toLocaleString()}
                  <span className={styles.currencySmall}>₴</span>
                </Text>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <Text variant="caption" weight="semibold" color="tertiary">ПОСТАВКИ</Text>
                </div>
                <Text variant="h3" weight="bold">
                  {Math.round(selectedShift.suppliesTotal).toLocaleString()}
                  <span className={styles.currencySmall}>₴</span>
                </Text>
              </div>
            </div>

            <div className={styles.activityList}>
              <div className={styles.activityListHeader}>
                <Text variant="labelMedium" weight="semibold">Дії ({shiftActivities.length})</Text>
              </div>
              {shiftActivities.length === 0 ? (
                <div className={styles.emptyActivity}>
                  <Text variant="bodySmall" color="tertiary">Немає записів за цю зміну</Text>
                </div>
              ) : (
                <div className={styles.activityItems}>
                  {shiftActivities.map((item) => {
                    if (item.kind === 'inline') {
                      return <ActivityInline key={item.activity.id} type={item.activity.type} timestamp={item.activity.timestamp} details={item.activity.details} />;
                    }
                    const isExpanded = shiftExpandedAccordionId === item.id;
                    if (item.type === 'order') return <OrderAccordion key={item.id} order={item.data as OrderData} isExpanded={isExpanded} onToggle={() => toggleShiftAccordion(item.id)} />;
                    if (item.type === 'supply') return <SupplyAccordion key={item.id} supply={item.data as SupplyAccordionData} isExpanded={isExpanded} onToggle={() => toggleShiftAccordion(item.id)} />;
                    return <WriteoffAccordion key={item.id} writeoff={item.data as WriteoffAccordionData} isExpanded={isExpanded} onToggle={() => toggleShiftAccordion(item.id)} />;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
