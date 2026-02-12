/**
 * ParadisePOS - Reports API
 */

import { apiClient } from './client';

// ============================================
// TYPES
// ============================================

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
}

export interface MonthlyReport {
  year: number;
  month: number;
  days: MonthlyDayData[];
  summary: MonthlyReportSummary;
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
};
