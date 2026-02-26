/**
 * CoffeePOS - Mock Reports API
 *
 * Aggregates real data from MockStore — orders, shifts, activities, supplies, writeoffs.
 */

import type {
  DailyReport,
  MonthlyReport,
  MonthlyDayData,
  ProductsReport,
  XReport,
  ZReport,
  TopProduct,
  PaymentBreakdown,
  OrderTypeBreakdown,
} from '@/lib/api/reports';
import type { Order } from '@/lib/api/types';
import type { Shift } from '@/lib/api/shifts';
import { getStore } from '../store';
import { mockDelay } from '../helpers';

// ============================================
// HELPERS
// ============================================

/** Check if an ISO timestamp falls within a date string (YYYY-MM-DD) */
function isOnDate(timestamp: string, dateStr: string): boolean {
  return timestamp.startsWith(dateStr);
}

/** Check if a shift overlaps a given date */
function shiftOverlapsDate(shift: Shift, dateStr: string): boolean {
  const dayStart = new Date(dateStr + 'T00:00:00').getTime();
  const dayEnd = new Date(dateStr + 'T23:59:59.999').getTime();
  const openedAt = new Date(shift.openedAt).getTime();
  const closedAt = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now();
  return openedAt <= dayEnd && closedAt >= dayStart;
}

/** Compute top products from completed orders */
function computeTopProducts(orders: Order[]): TopProduct[] {
  const productMap: Record<string, TopProduct> = {};

  for (const order of orders) {
    if (!order.items) continue;
    for (const item of order.items) {
      const name = item.productName || 'Товар';
      if (!productMap[name]) {
        productMap[name] = { name, quantity: 0, revenue: 0 };
      }
      productMap[name].quantity += item.quantity || 1;
      productMap[name].revenue += (item.unitPrice || 0) * (item.quantity || 1);
    }
  }

  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}

/** Compute order type breakdown from completed orders */
function computeOrderTypeBreakdown(orders: Order[]): OrderTypeBreakdown {
  let dine_in = 0, takeaway = 0, delivery = 0;
  for (const o of orders) {
    if (o.type === 'dine_in') dine_in++;
    else if (o.type === 'takeaway') takeaway++;
    else if (o.type === 'delivery') delivery++;
  }
  return { dine_in, takeaway, delivery };
}

// ============================================
// API
// ============================================

export const mockReportsApi = {
  async getDaily(date: string): Promise<{ data: DailyReport }> {
    await mockDelay();
    const store = getStore();

    // Filter data for this date
    const dayOrders = store.orders.filter((o) => isOnDate(o.createdAt, date));
    const completedOrders = dayOrders.filter((o) => o.status === 'completed');
    const cancelledOrders = dayOrders.filter((o) => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const cashSales = completedOrders
      .filter((o) => o.payment?.method === 'cash')
      .reduce((sum, o) => sum + o.total, 0);
    const cardSales = completedOrders
      .filter((o) => o.payment?.method === 'card')
      .reduce((sum, o) => sum + o.total, 0);

    const dayWriteoffs = store.writeoffs.filter((w) => isOnDate(w.createdAt, date));
    const writeOffsTotal = dayWriteoffs.reduce((sum, w) => sum + w.totalCost, 0);

    const daySupplies = store.supplies.filter((s) => isOnDate(s.createdAt, date));
    const suppliesTotal = daySupplies.reduce((sum, s) => sum + (s.totalCost || 0), 0);

    // Shifts that overlap this day
    const allShifts = [
      ...(store.currentShift ? [store.currentShift] : []),
      ...store.closedShifts,
    ];
    const dayShifts = allShifts.filter((s) => shiftOverlapsDate(s, date));

    // Activities for this day
    const dayActivities = store.activities.filter((a) => isOnDate(a.timestamp, date));

    const topProducts = computeTopProducts(completedOrders);

    const paymentBreakdown: PaymentBreakdown = {
      cash: cashSales,
      card: cardSales,
      qr: 0,
      other: Math.max(0, totalRevenue - cashSales - cardSales),
    };

    const orderTypeBreakdown = computeOrderTypeBreakdown(completedOrders);

    return {
      data: {
        date,
        orders: dayOrders,
        shifts: dayShifts,
        writeOffs: dayWriteoffs,
        supplies: daySupplies,
        activities: dayActivities,
        summary: {
          totalRevenue,
          ordersCount: completedOrders.length,
          cashSales,
          cardSales,
          writeOffsTotal,
          suppliesTotal,
          avgOrder: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        },
        topProducts,
        paymentBreakdown,
        orderTypeBreakdown,
        cancelledCount: cancelledOrders.length,
      },
    };
  },

  async getMonthly(year: number, month: number): Promise<{ data: MonthlyReport }> {
    await mockDelay();
    const store = getStore();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: MonthlyDayData[] = [];

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalWriteOffs = 0;
    let totalShifts = 0;

    const allShifts = [
      ...(store.currentShift ? [store.currentShift] : []),
      ...store.closedShifts,
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${prefix}-${String(d).padStart(2, '0')}`;

      const dayCompleted = store.orders.filter(
        (o) => isOnDate(o.createdAt, dateStr) && o.status === 'completed'
      );

      const revenue = dayCompleted.reduce((sum, o) => sum + o.total, 0);
      const ordersCount = dayCompleted.length;
      const cashSales = dayCompleted
        .filter((o) => o.payment?.method === 'cash')
        .reduce((sum, o) => sum + o.total, 0);
      const cardSales = dayCompleted
        .filter((o) => o.payment?.method === 'card')
        .reduce((sum, o) => sum + o.total, 0);

      const dayWo = store.writeoffs.filter((w) => isOnDate(w.createdAt, dateStr));
      const woTotal = dayWo.reduce((sum, w) => sum + w.totalCost, 0);

      const dayShifts = allShifts.filter((s) => shiftOverlapsDate(s, dateStr));

      days.push({
        date: dateStr,
        revenue,
        ordersCount,
        cashSales,
        cardSales,
        writeOffsTotal: woTotal,
        suppliesTotal: 0,
        shiftsCount: dayShifts.length,
      });

      totalRevenue += revenue;
      totalOrders += ordersCount;
      totalWriteOffs += woTotal;
      totalShifts += dayShifts.length;
    }

    // Previous month comparison — check if we have data
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevOrders = store.orders.filter(
      (o) => o.createdAt.startsWith(prevPrefix) && o.status === 'completed'
    );
    const previousMonthRevenue = prevOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = previousMonthRevenue > 0
      ? Math.round(((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 10000) / 100
      : 0;

    return {
      data: {
        year,
        month,
        days,
        summary: {
          totalRevenue,
          totalOrders,
          avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          totalShifts,
          totalWriteOffs,
          previousMonthRevenue,
          revenueChange,
        },
      },
    };
  },

  async getProducts(from: string, to: string): Promise<{ data: ProductsReport }> {
    await mockDelay();
    const store = getStore();

    // Filter completed orders within date range
    const completedOrders = store.orders.filter((o) => {
      if (o.status !== 'completed') return false;
      const d = o.createdAt.slice(0, 10);
      return d >= from && d <= to;
    });

    // Aggregate products
    const productMap: Record<string, { productId: string; productName: string; quantitySold: number; revenue: number }> = {};

    for (const order of completedOrders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const key = item.productName || 'Товар';
        const productId = item.product?.id ? String(item.product.id) : key;
        if (!productMap[key]) {
          productMap[key] = { productId, productName: key, quantitySold: 0, revenue: 0 };
        }
        productMap[key].quantitySold += item.quantity || 1;
        productMap[key].revenue += (item.unitPrice || 0) * (item.quantity || 1);
      }
    }

    const products = Object.values(productMap)
      .map((p) => ({
        ...p,
        avgPrice: p.quantitySold > 0 ? Math.round(p.revenue / p.quantitySold) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { data: { from, to, products } };
  },

  async getXReport(shiftId: string): Promise<{ data: XReport }> {
    await mockDelay();
    const store = getStore();
    const shift = store.currentShift?.id === Number(shiftId)
      ? store.currentShift
      : store.closedShifts.find((s) => s.id === Number(shiftId)) || store.currentShift;

    if (!shift) {
      throw { status: 404, name: 'NotFoundError', message: 'Shift not found' };
    }

    const durationMs = Date.now() - new Date(shift.openedAt).getTime();
    const durationHrs = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;

    return {
      data: {
        shiftId,
        openedAt: shift.openedAt,
        openedBy: shift.openedBy,
        openingCash: shift.openingCash,
        cashSales: shift.cashSales,
        cardSales: shift.cardSales,
        totalSales: shift.totalSales,
        ordersCount: shift.ordersCount,
        writeOffsTotal: shift.writeOffsTotal,
        suppliesTotal: shift.suppliesTotal,
        expectedCash: shift.openingCash + shift.cashSales,
        duration: durationHrs,
      },
    };
  },

  async getZReport(shiftId: string): Promise<{ data: ZReport }> {
    await mockDelay();
    const store = getStore();
    const shift = store.closedShifts.find((s) => s.id === Number(shiftId))
      || store.closedShifts[0]
      || store.currentShift;

    if (!shift) {
      throw { status: 404, name: 'NotFoundError', message: 'Shift not found' };
    }

    const openedMs = new Date(shift.openedAt).getTime();
    const closedMs = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now();
    const durationHrs = Math.round(((closedMs - openedMs) / (1000 * 60 * 60)) * 100) / 100;
    const expectedCash = shift.openingCash + shift.cashSales;

    return {
      data: {
        shiftId,
        openedAt: shift.openedAt,
        openedBy: shift.openedBy,
        openingCash: shift.openingCash,
        cashSales: shift.cashSales,
        cardSales: shift.cardSales,
        totalSales: shift.totalSales,
        ordersCount: shift.ordersCount,
        writeOffsTotal: shift.writeOffsTotal,
        suppliesTotal: shift.suppliesTotal,
        expectedCash,
        duration: durationHrs,
        closedAt: shift.closedAt || new Date().toISOString(),
        closedBy: shift.closedBy || shift.openedBy,
        closingCash: shift.closingCash,
        cashDifference: shift.closingCash - expectedCash,
      },
    };
  },
};
