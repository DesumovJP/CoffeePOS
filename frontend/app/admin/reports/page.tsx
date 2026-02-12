'use client';

/**
 * ParadisePOS - Reports Page
 *
 * Calendar view with month navigation and daily reports
 * Data sourced from backend API via useMonthlyReport / useDailyReport hooks
 */

import { useState, useMemo } from 'react';
import { Text, Icon, Button, Badge } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { OrderAccordion, CategoryTabs, type OrderData, type Category } from '@/components/molecules';
import { SupplyAccordion, type SupplyAccordionData } from '@/components/molecules';
import { WriteoffAccordion, type WriteoffAccordionData } from '@/components/molecules';
import { useMonthlyReport, useDailyReport } from '@/lib/hooks';
import type { MonthlyDayData, DailyReport } from '@/lib/api';
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
  return date.toISOString().split('T')[0];
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

type ShiftActivityTab = 'orders' | 'supplies' | 'writeoffs';

export default function ReportsPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayCell, setSelectedDayCell] = useState<DayCell | null>(null);
  const [expandedAccordionId, setExpandedAccordionId] = useState<string | null>(null);
  const [shiftActivityTab, setShiftActivityTab] = useState<ShiftActivityTab>('orders');

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
      setShiftActivityTab('orders');
    }
  };

  const handleCloseModal = () => {
    setSelectedDayKey(null);
    setSelectedDayCell(null);
    setExpandedAccordionId(null);
    setShiftActivityTab('orders');
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
      writeOffs: shift.writeOffsTotal || 0,
      startTime: shift.openedAt ? new Date(shift.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—',
      endTime: shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—',
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
                    <Text variant="labelSmall" weight="semibold" color="accent">
                      ₴{day.revenue.toFixed(0)}
                    </Text>
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
            {/* Shift Cards */}
            <div className={styles.shiftsList}>
              {isDailyLoading ? (
                <div className={styles.emptyShifts}>
                  <Text variant="bodyMedium" color="secondary">Завантаження...</Text>
                </div>
              ) : dailyShifts.length === 0 ? (
                <div className={styles.emptyShifts}>
                  <Icon name="info" size="xl" color="tertiary" />
                  <Text variant="bodyMedium" color="secondary">Немає даних про зміни</Text>
                </div>
              ) : (
                dailyShifts.map((shift) => {
                  const activityCategories: Category[] = [
                    { id: 'orders', name: 'Замовлення', count: dailyOrders.length },
                    { id: 'supplies', name: 'Поставки', count: dailySupplies.length },
                    { id: 'writeoffs', name: 'Списання', count: dailyWriteoffs.length },
                  ];

                  return (
                    <div key={shift.id} className={styles.shiftCard}>
                      {/* Shift Header — always visible, not clickable */}
                      <div className={styles.shiftCardHeader}>
                        <div className={styles.shiftHeaderLeft}>
                          <Badge
                            variant={shift.status === 'open' ? 'warning' : 'success'}
                            size="sm"
                          >
                            {shift.status === 'open' ? 'Відкрита' : 'Закрита'}
                          </Badge>
                          <Text variant="labelSmall" color="tertiary">
                            {shift.startTime} — {shift.endTime}
                          </Text>
                        </div>
                        <Text variant="bodySmall" weight="medium">{shift.employee}</Text>
                      </div>

                      {/* Shift Summary */}
                      <div className={styles.shiftSummary}>
                        <div className={styles.summaryGrid}>
                          <div className={styles.summaryCell}>
                            <div className={styles.summaryCellLabel}>
                              <Icon name="cash" size="sm" color="success" />
                              <Text variant="caption" color="secondary">Готівка</Text>
                            </div>
                            <Text variant="h4" weight="bold">₴{shift.cashSales}</Text>
                          </div>
                          <div className={styles.summaryCell}>
                            <div className={styles.summaryCellLabel}>
                              <Icon name="card" size="sm" color="info" />
                              <Text variant="caption" color="secondary">Картка</Text>
                            </div>
                            <Text variant="h4" weight="bold">₴{shift.cardSales}</Text>
                          </div>
                          <div className={styles.summaryCell}>
                            <div className={styles.summaryCellLabel}>
                              <Text variant="caption" color="secondary">Каса на ранок</Text>
                            </div>
                            <Text variant="labelLarge" weight="semibold">₴{shift.openingCash}</Text>
                          </div>
                          <div className={styles.summaryCell}>
                            <div className={styles.summaryCellLabel}>
                              <Text variant="caption" color="secondary">Каса на вечір</Text>
                            </div>
                            <Text variant="labelLarge" weight="semibold">₴{shift.closingCash}</Text>
                          </div>
                        </div>
                        {(shift.difference !== 0 || shift.writeOffs > 0) && (
                          <div className={styles.summaryIndicators}>
                            {shift.difference !== 0 && (
                              <div className={`${styles.indicator} ${shift.difference > 0 ? styles.indicatorSuccess : styles.indicatorError}`}>
                                <Text variant="caption" weight="semibold" color={shift.difference > 0 ? 'success' : 'error'}>
                                  Різниця {shift.difference > 0 ? '+' : '-'}₴{Math.abs(shift.difference)}
                                </Text>
                              </div>
                            )}
                            {shift.writeOffs > 0 && (
                              <div className={`${styles.indicator} ${styles.indicatorError}`}>
                                <Text variant="caption" weight="semibold" color="error">
                                  Списання -₴{shift.writeOffs}
                                </Text>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Activity Tabs */}
                      <div className={styles.activityTabs}>
                        <CategoryTabs
                          categories={activityCategories}
                          value={shiftActivityTab}
                          showAll={false}
                          onChange={(id) => {
                            setShiftActivityTab((id as ShiftActivityTab) || 'orders');
                            setExpandedAccordionId(null);
                          }}
                        />
                      </div>

                      {/* Activity Content */}
                      <div className={styles.activityContent}>
                        {shiftActivityTab === 'orders' && (
                          dailyOrders.length === 0 ? (
                            <div className={styles.emptyActivity}>
                              <Text variant="bodySmall" color="tertiary">Немає замовлень</Text>
                            </div>
                          ) : (
                            <div className={styles.accordionList}>
                              {[...dailyOrders]
                                .sort((a, b) => b.createdAt - a.createdAt)
                                .map((order) => (
                                  <OrderAccordion
                                    key={order.id}
                                    order={order}
                                    isExpanded={expandedAccordionId === order.id}
                                    onToggle={() => toggleAccordion(order.id)}
                                  />
                                ))}
                            </div>
                          )
                        )}
                        {shiftActivityTab === 'supplies' && (
                          dailySupplies.length === 0 ? (
                            <div className={styles.emptyActivity}>
                              <Text variant="bodySmall" color="tertiary">Немає поставок</Text>
                            </div>
                          ) : (
                            <div className={styles.accordionList}>
                              {[...dailySupplies]
                                .sort((a, b) => b.createdAt - a.createdAt)
                                .map((supply) => (
                                  <SupplyAccordion
                                    key={supply.id}
                                    supply={supply}
                                    isExpanded={expandedAccordionId === supply.id}
                                    onToggle={() => toggleAccordion(supply.id)}
                                  />
                                ))}
                            </div>
                          )
                        )}
                        {shiftActivityTab === 'writeoffs' && (
                          dailyWriteoffs.length === 0 ? (
                            <div className={styles.emptyActivity}>
                              <Text variant="bodySmall" color="tertiary">Немає списань</Text>
                            </div>
                          ) : (
                            <div className={styles.accordionList}>
                              {[...dailyWriteoffs]
                                .sort((a, b) => b.createdAt - a.createdAt)
                                .map((wo) => (
                                  <WriteoffAccordion
                                    key={wo.id}
                                    writeoff={wo}
                                    isExpanded={expandedAccordionId === wo.id}
                                    onToggle={() => toggleAccordion(wo.id)}
                                  />
                                ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
