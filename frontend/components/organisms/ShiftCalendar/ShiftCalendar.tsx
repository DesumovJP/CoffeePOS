'use client';

/**
 * CoffeePOS - ShiftCalendar Component
 *
 * Weekly calendar view for managing employee shifts
 */

import { forwardRef, useState, useMemo, useCallback, type HTMLAttributes } from 'react';
import { Text, Button, Icon, GlassCard } from '@/components/atoms';
import styles from './ShiftCalendar.module.css';

// ============================================
// TYPES
// ============================================

export interface Employee {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'morning' | 'afternoon' | 'evening' | 'full';
  notes?: string;
}

export interface ShiftCalendarProps extends HTMLAttributes<HTMLDivElement> {
  /** List of employees */
  employees?: Employee[];
  /** List of shifts */
  shifts?: Shift[];
  /** Current week start date */
  weekStart?: Date;
  /** Callback when week changes */
  onWeekChange?: (weekStart: Date) => void;
  /** Callback when shift is clicked */
  onShiftClick?: (shift: Shift) => void;
  /** Callback when empty slot is clicked */
  onSlotClick?: (date: string, timeSlot: string) => void;
  /** Callback when shift is added */
  onAddShift?: (date: string) => void;
  /** Loading state */
  loading?: boolean;
}

// ============================================
// HELPERS
// ============================================

const DAYS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const DAYS_FULL_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
const MONTHS_UK = [
  'Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня',
  'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Ранок', time: '06:00 - 14:00' },
  { id: 'afternoon', label: 'День', time: '14:00 - 22:00' },
  { id: 'evening', label: 'Вечір', time: '22:00 - 06:00' },
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getShiftTypeFromTime(startTime: string): Shift['type'] {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'evening';
}

const EMPLOYEE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

// ============================================
// COMPONENT
// ============================================

export const ShiftCalendar = forwardRef<HTMLDivElement, ShiftCalendarProps>(
  (
    {
      employees = [],
      shifts = [],
      weekStart: initialWeekStart,
      onWeekChange,
      onShiftClick,
      onSlotClick,
      onAddShift,
      loading = false,
      className,
      ...props
    },
    ref
  ) => {
    const [weekStart, setWeekStart] = useState(() =>
      initialWeekStart ? getWeekStart(initialWeekStart) : getWeekStart(new Date())
    );

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

    const weekEnd = useMemo(() => {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      return end;
    }, [weekStart]);

    // Group shifts by date
    const shiftsByDate = useMemo(() => {
      const map = new Map<string, Shift[]>();
      shifts.forEach((shift) => {
        const existing = map.get(shift.date) || [];
        map.set(shift.date, [...existing, shift]);
      });
      return map;
    }, [shifts]);

    // Employee map for quick lookup
    const employeeMap = useMemo(() => {
      const map = new Map<string, Employee>();
      employees.forEach((emp, index) => {
        map.set(emp.id, {
          ...emp,
          color: emp.color || EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length],
        });
      });
      return map;
    }, [employees]);

    const navigateWeek = useCallback((direction: 'prev' | 'next') => {
      const newStart = new Date(weekStart);
      newStart.setDate(newStart.getDate() + (direction === 'prev' ? -7 : 7));
      setWeekStart(newStart);
      onWeekChange?.(newStart);
    }, [weekStart, onWeekChange]);

    const goToToday = useCallback(() => {
      const today = getWeekStart(new Date());
      setWeekStart(today);
      onWeekChange?.(today);
    }, [onWeekChange]);

    const formatWeekRange = useCallback(() => {
      const startMonth = MONTHS_UK[weekStart.getMonth()];
      const endMonth = MONTHS_UK[weekEnd.getMonth()];

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${weekStart.getFullYear()}`;
      }
      return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${weekStart.getFullYear()}`;
    }, [weekStart, weekEnd]);

    const renderShift = (shift: Shift) => {
      const employee = employeeMap.get(shift.employeeId);

      return (
        <button
          key={shift.id}
          className={styles.shift}
          style={{ '--shift-color': employee?.color || '#6B6B6B' } as React.CSSProperties}
          onClick={() => onShiftClick?.(shift)}
          title={`${employee?.name || 'Невідомий'}: ${shift.startTime} - ${shift.endTime}`}
        >
          <span className={styles.shiftEmployee}>{employee?.name || '?'}</span>
          <span className={styles.shiftTime}>{shift.startTime} - {shift.endTime}</span>
        </button>
      );
    };

    const classNames = [styles.container, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Header with navigation */}
        <div className={styles.header}>
          <div className={styles.navigation}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('prev')}
              aria-label="Попередній тиждень"
            >
              <Icon name="chevronLeft" size="sm" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
            >
              Сьогодні
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('next')}
              aria-label="Наступний тиждень"
            >
              <Icon name="chevronRight" size="sm" />
            </Button>
          </div>

          <Text variant="h3" className={styles.weekTitle}>
            {formatWeekRange()}
          </Text>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddShift?.(formatDate(new Date()))}
            >
              <Icon name="plus" size="sm" />
              Додати зміну
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className={styles.calendar}>
          {/* Time column header */}
          <div className={styles.timeHeader}>
            <Text variant="caption" color="tertiary">Час</Text>
          </div>

          {/* Day headers */}
          {weekDays.map((day, index) => (
            <div
              key={formatDate(day)}
              className={`${styles.dayHeader} ${isToday(day) ? styles.today : ''} ${isWeekend(day) ? styles.weekend : ''}`}
            >
              <Text variant="caption" color="secondary">{DAYS_UK[index]}</Text>
              <Text variant="h4" weight={isToday(day) ? 'bold' : 'medium'}>
                {day.getDate()}
              </Text>
            </div>
          ))}

          {/* Time slots */}
          {TIME_SLOTS.map((slot) => (
            <>
              {/* Time label */}
              <div key={`time-${slot.id}`} className={styles.timeSlot}>
                <Text variant="labelSmall" weight="medium">{slot.label}</Text>
                <Text variant="caption" color="tertiary">{slot.time}</Text>
              </div>

              {/* Day cells */}
              {weekDays.map((day) => {
                const dateStr = formatDate(day);
                const dayShifts = shiftsByDate.get(dateStr)?.filter(
                  (s) => s.type === slot.id || getShiftTypeFromTime(s.startTime) === slot.id
                ) || [];

                return (
                  <div
                    key={`${dateStr}-${slot.id}`}
                    className={`${styles.cell} ${isToday(day) ? styles.todayCell : ''} ${isWeekend(day) ? styles.weekendCell : ''}`}
                    onClick={() => onSlotClick?.(dateStr, slot.id)}
                  >
                    {dayShifts.map(renderShift)}
                    {dayShifts.length === 0 && (
                      <div className={styles.emptySlot}>
                        <Icon name="plus" size="xs" />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        {employees.length > 0 && (
          <div className={styles.legend}>
            <Text variant="labelSmall" color="secondary" style={{ marginRight: '1rem' }}>
              Працівники:
            </Text>
            {employees.map((emp, index) => (
              <div key={emp.id} className={styles.legendItem}>
                <span
                  className={styles.legendColor}
                  style={{ backgroundColor: emp.color || EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length] }}
                />
                <Text variant="caption">{emp.name}</Text>
              </div>
            ))}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className={styles.loading}>
            <Text color="secondary">Завантаження...</Text>
          </div>
        )}
      </div>
    );
  }
);

ShiftCalendar.displayName = 'ShiftCalendar';
