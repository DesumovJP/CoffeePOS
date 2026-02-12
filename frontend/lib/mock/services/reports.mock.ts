/**
 * ParadisePOS - Mock Reports API
 */

import type {
  DailyReport,
  MonthlyReport,
  MonthlyDayData,
} from '@/lib/api/reports';
import { getStore } from '../store';
import { mockDelay } from '../helpers';

export const mockReportsApi = {
  async getDaily(date: string): Promise<{ data: DailyReport }> {
    await mockDelay();
    const store = getStore();

    // Filter orders for this date
    const dayOrders = store.orders.filter((o) => o.createdAt.startsWith(date));
    const completedOrders = dayOrders.filter((o) => o.status === 'completed');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const cashOrders = completedOrders.filter((o) => o.payment?.method === 'cash');
    const cardOrders = completedOrders.filter((o) => o.payment?.method === 'card');
    const cashSales = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const cardSales = cardOrders.reduce((sum, o) => sum + o.total, 0);

    const dayWriteoffs = store.writeoffs.filter((w) => w.createdAt.startsWith(date));
    const writeOffsTotal = dayWriteoffs.reduce((sum, w) => sum + w.totalCost, 0);

    const daySupplies = store.supplies.filter((s) => s.createdAt.startsWith(date));

    return {
      data: {
        date,
        orders: completedOrders,
        shifts: store.currentShift ? [store.currentShift] : [],
        writeOffs: dayWriteoffs,
        supplies: daySupplies,
        summary: {
          totalRevenue,
          ordersCount: completedOrders.length,
          cashSales,
          cardSales,
          writeOffsTotal,
          avgOrder: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        },
      },
    };
  },

  async getMonthly(year: number, month: number): Promise<{ data: MonthlyReport }> {
    await mockDelay();
    const store = getStore();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    // Generate day data for the whole month
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: MonthlyDayData[] = [];

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalWriteOffs = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${prefix}-${String(d).padStart(2, '0')}`;
      const dayOrders = store.orders.filter(
        (o) => o.createdAt.startsWith(dateStr) && o.status === 'completed'
      );

      // If no real orders for this day, generate some sample data for past days
      const today = new Date();
      const thisDay = new Date(year, month - 1, d);
      const isPast = thisDay < today;

      const revenue = dayOrders.length > 0
        ? dayOrders.reduce((sum, o) => sum + o.total, 0)
        : isPast ? 3000 + Math.floor(Math.random() * 4000) : 0;
      const ordersCount = dayOrders.length > 0
        ? dayOrders.length
        : isPast ? 15 + Math.floor(Math.random() * 20) : 0;
      const cashSales = Math.round(revenue * 0.35);
      const cardSales = revenue - cashSales;
      const woTotal = isPast ? Math.floor(Math.random() * 100) : 0;

      days.push({
        date: dateStr,
        revenue,
        ordersCount,
        cashSales,
        cardSales,
        writeOffsTotal: woTotal,
        shiftsCount: isPast ? 1 : 0,
      });

      totalRevenue += revenue;
      totalOrders += ordersCount;
      totalWriteOffs += woTotal;
    }

    return {
      data: {
        year,
        month,
        days,
        summary: {
          totalRevenue,
          totalOrders,
          avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          totalShifts: days.filter((d) => d.shiftsCount > 0).length,
          totalWriteOffs,
        },
      },
    };
  },
};
