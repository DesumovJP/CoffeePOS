/**
 * CoffeePOS - Mock Reports API
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
import { getStore } from '../store';
import { mockDelay } from '../helpers';

// Product names for mock data
const PRODUCT_NAMES = [
  'Капучино', 'Лате', 'Еспресо', 'Американо', 'Раф',
  'Чай зелений', 'Флет вайт', 'Мокко', 'Какао', 'Матча лате',
];

export const mockReportsApi = {
  async getDaily(date: string): Promise<{ data: DailyReport }> {
    await mockDelay();
    const store = getStore();

    // Filter orders for this date
    const dayOrders = store.orders.filter((o) => o.createdAt.startsWith(date));
    const completedOrders = dayOrders.filter((o) => o.status === 'completed');
    const cancelledOrders = dayOrders.filter((o) => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const cashOrders = completedOrders.filter((o) => o.payment?.method === 'cash');
    const cardOrders = completedOrders.filter((o) => o.payment?.method === 'card');
    const cashSales = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const cardSales = cardOrders.reduce((sum, o) => sum + o.total, 0);

    const dayWriteoffs = store.writeoffs.filter((w) => w.createdAt.startsWith(date));
    const writeOffsTotal = dayWriteoffs.reduce((sum, w) => sum + w.totalCost, 0);

    const daySupplies = store.supplies.filter((s) => s.createdAt.startsWith(date));

    // Generate top products from order items
    const topProducts: TopProduct[] = [];
    const productMap: Record<string, TopProduct> = {};
    for (const order of completedOrders) {
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

    // If no real data, generate mock top products
    if (Object.keys(productMap).length === 0) {
      for (let i = 0; i < 5; i++) {
        topProducts.push({
          name: PRODUCT_NAMES[i],
          quantity: 10 - i * 2 + Math.floor(Math.random() * 3),
          revenue: (10 - i * 2) * (65 + Math.floor(Math.random() * 40)),
        });
      }
    } else {
      topProducts.push(
        ...Object.values(productMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10)
      );
    }

    // Payment breakdown
    const qrSales = totalRevenue > 0 ? Math.round(totalRevenue * 0.1) : 0;
    const paymentBreakdown: PaymentBreakdown = {
      cash: cashSales || Math.round(totalRevenue * 0.35),
      card: cardSales || Math.round(totalRevenue * 0.55),
      qr: qrSales,
      other: 0,
    };

    // Order type breakdown
    const orderTypeBreakdown: OrderTypeBreakdown = {
      dine_in: Math.ceil(completedOrders.length * 0.6) || 0,
      takeaway: Math.floor(completedOrders.length * 0.3) || 0,
      delivery: Math.floor(completedOrders.length * 0.1) || 0,
    };

    return {
      data: {
        date,
        orders: completedOrders,
        shifts: store.currentShift ? [store.currentShift] : [],
        writeOffs: dayWriteoffs,
        supplies: daySupplies,
        activities: [],
        summary: {
          totalRevenue,
          ordersCount: completedOrders.length,
          cashSales,
          cardSales,
          writeOffsTotal,
          suppliesTotal: daySupplies.reduce((sum: number, s: any) => sum + (s.totalCost || 0), 0),
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

    // Mock previous month revenue for comparison
    const previousMonthRevenue = totalRevenue > 0
      ? totalRevenue * (0.85 + Math.random() * 0.3)
      : 0;
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
          totalShifts: days.filter((d) => d.shiftsCount > 0).length,
          totalWriteOffs,
          previousMonthRevenue: Math.round(previousMonthRevenue),
          revenueChange,
        },
      },
    };
  },

  async getProducts(from: string, to: string): Promise<{ data: ProductsReport }> {
    await mockDelay();

    // Generate mock product analytics
    const products = PRODUCT_NAMES.map((name, idx) => {
      const quantitySold = 50 - idx * 5 + Math.floor(Math.random() * 10);
      const avgPrice = 55 + Math.floor(Math.random() * 50);
      const revenue = quantitySold * avgPrice;
      return {
        productId: String(idx + 1),
        productName: name,
        quantitySold,
        revenue,
        avgPrice,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      data: {
        from,
        to,
        products,
      },
    };
  },

  async getXReport(shiftId: string): Promise<{ data: XReport }> {
    await mockDelay();
    const store = getStore();
    const shift = store.currentShift;

    const openingCash = shift?.openingCash || 500;
    const cashSales = shift?.cashSales || 1250;
    const cardSales = shift?.cardSales || 2100;
    const totalSales = cashSales + cardSales;

    return {
      data: {
        shiftId,
        openedAt: shift?.openedAt || new Date().toISOString(),
        openedBy: shift?.openedBy || 'Баріста',
        openingCash,
        cashSales,
        cardSales,
        totalSales,
        ordersCount: 18,
        writeOffsTotal: 120,
        suppliesTotal: 350,
        expectedCash: openingCash + cashSales,
        duration: 5.5,
      },
    };
  },

  async getZReport(shiftId: string): Promise<{ data: ZReport }> {
    await mockDelay();
    const store = getStore();
    const shift = store.closedShifts?.[0] || store.currentShift;

    const openingCash = shift?.openingCash || 500;
    const cashSales = shift?.cashSales || 1250;
    const cardSales = shift?.cardSales || 2100;
    const closingCash = shift?.closingCash || 1720;
    const totalSales = cashSales + cardSales;
    const expectedCash = openingCash + cashSales;

    return {
      data: {
        shiftId,
        openedAt: shift?.openedAt || new Date().toISOString(),
        openedBy: shift?.openedBy || 'Баріста',
        openingCash,
        cashSales,
        cardSales,
        totalSales,
        ordersCount: 32,
        writeOffsTotal: 180,
        suppliesTotal: 500,
        expectedCash,
        duration: 10.25,
        closedAt: shift?.closedAt || new Date().toISOString(),
        closedBy: shift?.closedBy || 'Менеджер',
        closingCash,
        cashDifference: closingCash - expectedCash,
      },
    };
  },
};
