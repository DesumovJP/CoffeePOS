'use client';

/**
 * CoffeePOS - Reports Page
 *
 * Calendar view with month navigation and daily reports
 * Data sourced from backend API via useMonthlyReport / useDailyReport hooks
 */

import { useState, useMemo } from 'react';
import { Text, Icon, Button } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { OrderAccordion, type OrderData } from '@/components/molecules';
import { SupplyAccordion, type SupplyAccordionData } from '@/components/molecules';
import { WriteoffAccordion, type WriteoffAccordionData } from '@/components/molecules';
import { ActivityInline } from '@/components/molecules';
import { useMonthlyReport, useDailyReport } from '@/lib/hooks';
import type { MonthlyDayData, ShiftActivity } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// TYPES
// ============================================

interface DayCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  // API data (if available)
  ordersCount: number;
  revenue: number;
  cashSales: number;
  cardSales: number;
  writeOffsTotal: number;
  shiftsCount: number;
}

// ============================================
// HELPERS
// ============================================

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const MONTHS_SHORT = [
  'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
  'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'
];

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
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

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toString();
}

// ============================================
// COMPONENT
// ============================================

type LegacyActivityType = 'order' | 'supply' | 'writeoff';

interface LegacyDailyActivity {
  id: string;
  type: LegacyActivityType;
  createdAt: number;
  data: OrderData | SupplyAccordionData | WriteoffAccordionData;
}

type DailyActivityItem =
  | { kind: 'accordion'; id: string; type: LegacyActivityType; createdAt: number; data: OrderData | SupplyAccordionData | WriteoffAccordionData }
  | { kind: 'inline'; activity: ShiftActivity; createdAt: number };

export default function ReportsPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayCell, setSelectedDayCell] = useState<DayCell | null>(null);
  const [expandedAccordionId, setExpandedAccordionId] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftExpandedAccordionId, setShiftExpandedAccordionId] = useState<string | null>(null);

  // Fetch monthly report from API (month is 1-based for API)
  const { data: monthlyReport, isLoading: isMonthlyLoading } = useMonthlyReport(currentYear, currentMonth + 1);

  // Fetch daily report when a day is selected
  const { data: dailyReport, isLoading: isDailyLoading } = useDailyReport(selectedDayKey || '');

  // Build a lookup map from API monthly data
  const dayDataMap = useMemo(() => {
    const map = new Map<string, MonthlyDayData>();
    if (monthlyReport?.days) {
      monthlyReport.days.forEach((day) => {
        map.set(day.date, day);
      });
    }
    return map;
  }, [monthlyReport]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const calendarDays = useMemo((): DayCell[] => {
    const days = getCalendarDays(currentYear, currentMonth);
    const todayKey = getDateKey(today);

    return days.map((date) => {
      const dateKey = getDateKey(date);
      const apiData = dayDataMap.get(dateKey);

      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isToday: dateKey === todayKey,
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
    if (monthlyReport?.summary) {
      return {
        totalRevenue: monthlyReport.summary.totalRevenue,
        totalOrders: monthlyReport.summary.totalOrders,
        avgOrder: monthlyReport.summary.avgOrder,
      };
    }
    // Calculate from calendar days as fallback
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

  // Transform daily report orders for accordion
  const dailyOrders: OrderData[] = useMemo(() => {
    if (!dailyReport?.orders) return [];
    return dailyReport.orders.map((order: any) => ({
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
  }, [dailyReport]);

  // Transform daily report shifts
  const dailyShifts = useMemo(() => {
    if (!dailyReport?.shifts) return [];
    return dailyReport.shifts.map((shift: any) => ({
      id: String(shift.id || shift.documentId),
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
  }, [dailyReport]);

  // Transform daily report supplies for accordion
  const dailySupplies: SupplyAccordionData[] = useMemo(() => {
    if (!dailyReport?.supplies) return [];
    return dailyReport.supplies.map((supply: any) => ({
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
  }, [dailyReport]);

  // Transform daily report write-offs for accordion
  const dailyWriteoffs: WriteoffAccordionData[] = useMemo(() => {
    if (!dailyReport?.writeOffs) return [];
    return dailyReport.writeOffs.map((wo: any) => ({
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
  }, [dailyReport]);

  // Lookup maps for matching server activities to accordion data
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

  // Unified daily activities sorted chronologically (newest first)
  // Uses server activities when available, falls back to client-side merge
  const dailyActivities = useMemo((): DailyActivityItem[] => {
    const serverActivities = dailyReport?.activities;

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
          if (order) {
            usedOrderIds.add(orderId);
            items.push({ kind: 'accordion', id: `order-${orderId}`, type: 'order', createdAt: ts, data: order });
          }
        } else if (activity.type === 'supply_receive') {
          const supplyId = String(activity.details.supplyId);
          const supply = suppliesById.get(supplyId);
          if (supply) {
            usedSupplyIds.add(supplyId);
            items.push({ kind: 'accordion', id: `supply-${supplyId}`, type: 'supply', createdAt: ts, data: supply });
          }
        } else if (activity.type === 'writeoff_create') {
          const woId = String(activity.details.writeOffId);
          const wo = writeoffsById.get(woId);
          if (wo) {
            usedWriteoffIds.add(woId);
            items.push({ kind: 'accordion', id: `writeoff-${woId}`, type: 'writeoff', createdAt: ts, data: wo });
          }
        } else {
          // shift_open, shift_close, order_status → inline
          items.push({ kind: 'inline', activity, createdAt: ts });
        }
      }

      // Add any orders/supplies/writeoffs not covered by server activities (older data)
      dailyOrders.forEach((order) => {
        if (!usedOrderIds.has(order.id)) {
          items.push({ kind: 'accordion', id: `order-${order.id}`, type: 'order', createdAt: order.createdAt, data: order });
        }
      });
      dailySupplies.forEach((supply) => {
        if (!usedSupplyIds.has(supply.id)) {
          items.push({ kind: 'accordion', id: `supply-${supply.id}`, type: 'supply', createdAt: supply.createdAt, data: supply });
        }
      });
      dailyWriteoffs.forEach((wo) => {
        if (!usedWriteoffIds.has(wo.id)) {
          items.push({ kind: 'accordion', id: `writeoff-${wo.id}`, type: 'writeoff', createdAt: wo.createdAt, data: wo });
        }
      });

      return items.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Fallback: client-side merge (for shifts without activities field)
    const items: DailyActivityItem[] = [];
    dailyOrders.forEach((order) => {
      items.push({ kind: 'accordion', id: `order-${order.id}`, type: 'order', createdAt: order.createdAt, data: order });
    });
    dailySupplies.forEach((supply) => {
      items.push({ kind: 'accordion', id: `supply-${supply.id}`, type: 'supply', createdAt: supply.createdAt, data: supply });
    });
    dailyWriteoffs.forEach((wo) => {
      items.push({ kind: 'accordion', id: `writeoff-${wo.id}`, type: 'writeoff', createdAt: wo.createdAt, data: wo });
    });
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [dailyReport, dailyOrders, dailySupplies, dailyWriteoffs, ordersById, suppliesById, writeoffsById]);

  // Selected shift and its filtered activities
  const selectedShift = dailyShifts.find(s => s.id === selectedShiftId) || null;

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

  return (
    <div className={styles.page}>
      {/* Calendar Header */}
      <div className={styles.calendarHeader}>
        {/* Stats Left */}
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

        {/* Month Navigation - Centered */}
        <div className={styles.monthNav}>
          <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
            <Icon name="chevron-left" size="md" />
          </Button>
          <div className={styles.monthTitle}>
            <Text variant="h4" weight="semibold">
              {MONTHS[currentMonth]} {currentYear}
            </Text>
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <Icon name="chevron-right" size="md" />
          </Button>
        </div>

        {/* Stats Right */}
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
        {/* Weekday Headers */}
        <div className={styles.weekdays}>
          {WEEKDAYS.map((day) => (
            <div key={day} className={styles.weekday}>
              <Text variant="labelSmall" color="tertiary" weight="medium">{day}</Text>
            </div>
          ))}
        </div>

        {/* Days Grid */}
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
                      <Text variant="labelSmall" weight="semibold" color="accent">
                        ₴{formatNumber(day.revenue)}
                      </Text>
                    </div>
                    {day.writeOffsTotal > 0 && (
                      <div className={styles.dayIndicator}>
                        <span className={`${styles.dayIndicatorDot} ${styles.dotError}`} />
                        <Text variant="labelSmall" weight="semibold" color="error">
                          -₴{formatNumber(day.writeOffsTotal)}
                        </Text>
                      </div>
                    )}
                    <Text variant="caption" color="tertiary">
                      {day.ordersCount} зам.
                    </Text>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* No Data Hint */}
      {!isMonthlyLoading && !monthlyReport && (
        <div className={styles.emptyShifts}>
          <Icon name="chart" size="xl" color="tertiary" />
          <Text variant="bodyMedium" color="secondary">Підключіть бекенд для перегляду звітів</Text>
          <Text variant="bodySmall" color="tertiary">Дані будуть відображатися після створення замовлень</Text>
        </div>
      )}

      {/* Day Detail Modal */}
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
            {isDailyLoading ? (
              <div className={styles.emptyShifts}>
                <Text variant="bodyMedium" color="secondary">Завантаження...</Text>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className={styles.summaryCards}>
                  {/* Revenue */}
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">ВИРУЧКА</Text>
                      <Text variant="caption" weight="semibold" color="success">
                        {dailyOrders.length} зам.
                      </Text>
                    </div>
                    <Text variant="h3" weight="bold">
                      {Math.round(selectedDayCell.revenue).toLocaleString()}
                      <span className={styles.currencySmall}>₴</span>
                    </Text>
                    <Text variant="caption" color="tertiary">
                      сер. чек {dailyOrders.length > 0 ? Math.round(selectedDayCell.revenue / dailyOrders.length) : 0} ₴
                    </Text>
                  </div>

                  {/* Cash */}
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

                  {/* Write-offs */}
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">СПИСАННЯ</Text>
                      <Text variant="caption" weight="semibold" color="warning">
                        {dailyWriteoffs.length} оп.
                      </Text>
                    </div>
                    <Text variant="h3" weight="bold">
                      {Math.round(dailyWriteoffs.reduce((s, w) => s + w.totalCost, 0)).toLocaleString()}
                      <span className={styles.currencySmall}>₴</span>
                    </Text>
                    <Text variant="caption" color="tertiary">
                      {dailyWriteoffs.reduce((s, w) => s + w.items.length, 0)} позицій
                    </Text>
                  </div>

                  {/* Supplies */}
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Text variant="caption" weight="semibold" color="tertiary">ПОСТАВКИ</Text>
                      <Text variant="caption" weight="semibold" color="info">
                        {dailySupplies.length} оп.
                      </Text>
                    </div>
                    <Text variant="h3" weight="bold">
                      {Math.round(dailySupplies.reduce((s, sp) => s + sp.totalCost, 0)).toLocaleString()}
                      <span className={styles.currencySmall}>₴</span>
                    </Text>
                    <Text variant="caption" color="tertiary">
                      {dailySupplies.reduce((s, sp) => s + sp.items.length, 0)} позицій
                    </Text>
                  </div>
                </div>

                {/* Shifts Section */}
                {dailyShifts.length > 0 && (
                  <div className={styles.shiftsSection}>
                    <div className={styles.shiftsSectionHeader}>
                      <Text variant="labelMedium" weight="semibold">
                        Зміни ({dailyShifts.length})
                      </Text>
                    </div>
                    <div className={styles.shiftCards}>
                      {dailyShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={`${styles.shiftCard} ${shift.status === 'open' ? styles.shiftCardOpen : ''}`}
                          onClick={() => { setSelectedShiftId(shift.id); setShiftExpandedAccordionId(null); }}
                        >
                          <div className={styles.shiftCardTop}>
                            <div className={styles.shiftCardTime}>
                              <Icon name="clock" size="sm" color="tertiary" />
                              <Text variant="labelMedium" weight="semibold">
                                {shift.startTime} — {shift.status === 'open' ? 'зараз' : shift.endTime}
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
                    </div>
                  </div>
                )}

                {/* Activities List */}
                <div className={styles.activityList}>
                  <div className={styles.activityListHeader}>
                    <Text variant="labelMedium" weight="semibold">
                      Дії ({dailyActivities.length})
                    </Text>
                  </div>
                  {dailyActivities.length === 0 ? (
                    <div className={styles.emptyActivity}>
                      <Text variant="bodySmall" color="tertiary">Немає записів</Text>
                    </div>
                  ) : (
                    <div className={styles.activityItems}>
                      {dailyActivities.map((item, idx) => {
                        if (item.kind === 'inline') {
                          return (
                            <ActivityInline
                              key={item.activity.id}
                              type={item.activity.type}
                              timestamp={item.activity.timestamp}
                              details={item.activity.details}
                            />
                          );
                        }

                        const isExpanded = expandedAccordionId === item.id;
                        if (item.type === 'order') {
                          return (
                            <OrderAccordion
                              key={item.id}
                              order={item.data as OrderData}
                              isExpanded={isExpanded}
                              onToggle={() => toggleAccordion(item.id)}
                            />
                          );
                        }
                        if (item.type === 'supply') {
                          return (
                            <SupplyAccordion
                              key={item.id}
                              supply={item.data as SupplyAccordionData}
                              isExpanded={isExpanded}
                              onToggle={() => toggleAccordion(item.id)}
                            />
                          );
                        }
                        return (
                          <WriteoffAccordion
                            key={item.id}
                            writeoff={item.data as WriteoffAccordionData}
                            isExpanded={isExpanded}
                            onToggle={() => toggleAccordion(item.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Shift Detail Modal */}
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
            {/* Summary Cards */}
            <div className={styles.summaryCards}>
              {/* Sales */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <Text variant="caption" weight="semibold" color="tertiary">ПРОДАЖІ</Text>
                  <Text variant="caption" weight="semibold" color="success">
                    {selectedShift.ordersCount} зам.
                  </Text>
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

              {/* Cash Flow */}
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

              {/* Write-offs */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <Text variant="caption" weight="semibold" color="tertiary">СПИСАННЯ</Text>
                </div>
                <Text variant="h3" weight="bold">
                  {Math.round(selectedShift.writeOffs).toLocaleString()}
                  <span className={styles.currencySmall}>₴</span>
                </Text>
              </div>

              {/* Supplies */}
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

            {/* Activities List */}
            <div className={styles.activityList}>
              <div className={styles.activityListHeader}>
                <Text variant="labelMedium" weight="semibold">
                  Дії ({shiftActivities.length})
                </Text>
              </div>
              {shiftActivities.length === 0 ? (
                <div className={styles.emptyActivity}>
                  <Text variant="bodySmall" color="tertiary">Немає записів за цю зміну</Text>
                </div>
              ) : (
                <div className={styles.activityItems}>
                  {shiftActivities.map((item) => {
                    if (item.kind === 'inline') {
                      return (
                        <ActivityInline
                          key={item.activity.id}
                          type={item.activity.type}
                          timestamp={item.activity.timestamp}
                          details={item.activity.details}
                        />
                      );
                    }

                    const isExpanded = shiftExpandedAccordionId === item.id;
                    if (item.type === 'order') {
                      return (
                        <OrderAccordion
                          key={item.id}
                          order={item.data as OrderData}
                          isExpanded={isExpanded}
                          onToggle={() => toggleShiftAccordion(item.id)}
                        />
                      );
                    }
                    if (item.type === 'supply') {
                      return (
                        <SupplyAccordion
                          key={item.id}
                          supply={item.data as SupplyAccordionData}
                          isExpanded={isExpanded}
                          onToggle={() => toggleShiftAccordion(item.id)}
                        />
                      );
                    }
                    return (
                      <WriteoffAccordion
                        key={item.id}
                        writeoff={item.data as WriteoffAccordionData}
                        isExpanded={isExpanded}
                        onToggle={() => toggleShiftAccordion(item.id)}
                      />
                    );
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
