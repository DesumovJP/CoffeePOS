/**
 * CoffeePOS - Reports API
 */

import { apiClient } from './client';

// ============================================
// TYPES
// ============================================

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  qr: number;
  other: number;
}

export interface OrderTypeBreakdown {
  dine_in: number;
  takeaway: number;
  delivery: number;
}

export interface DailyReportSummary {
  totalRevenue: number;
  ordersCount: number;
  cashSales: number;
  cardSales: number;
  writeOffsTotal: number;
  avgOrder: number;
}

export interface DailyReport {
  date: string;
  orders: any[];
  shifts: any[];
  writeOffs: any[];
  supplies: any[];
  summary: DailyReportSummary;
  topProducts: TopProduct[];
  paymentBreakdown: PaymentBreakdown;
  orderTypeBreakdown: OrderTypeBreakdown;
  cancelledCount: number;
}

export interface MonthlyDayData {
  date: string;
  revenue: number;
  ordersCount: number;
  cashSales: number;
  cardSales: number;
  writeOffsTotal: number;
  shiftsCount: number;
}

export interface MonthlyReportSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  totalShifts: number;
  totalWriteOffs: number;
  previousMonthRevenue: number;
  revenueChange: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  days: MonthlyDayData[];
  summary: MonthlyReportSummary;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
}

export interface ProductsReport {
  from: string;
  to: string;
  products: ProductAnalytics[];
}

export interface XReport {
  shiftId: string;
  openedAt: string;
  openedBy: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  totalSales: number;
  ordersCount: number;
  writeOffsTotal: number;
  suppliesTotal: number;
  expectedCash: number;
  duration: number;
}

export interface ZReport extends XReport {
  closedAt: string | null;
  closedBy: string;
  closingCash: number;
  cashDifference: number;
}

// ============================================
// API METHODS
// ============================================

export const reportsApi = {
  async getDaily(date: string): Promise<{ data: DailyReport }> {
    return apiClient.get<DailyReport>('/reports/daily', { date });
  },

  async getMonthly(year: number, month: number): Promise<{ data: MonthlyReport }> {
    return apiClient.get<MonthlyReport>('/reports/monthly', { year, month });
  },

  async getProducts(from: string, to: string): Promise<{ data: ProductsReport }> {
    return apiClient.get<ProductsReport>('/reports/products', { from, to });
  },

  async getXReport(shiftId: string): Promise<{ data: XReport }> {
    return apiClient.get<XReport>('/reports/x-report', { shiftId });
  },

  async getZReport(shiftId: string): Promise<{ data: ZReport }> {
    return apiClient.get<ZReport>('/reports/z-report', { shiftId });
  },
};
