'use client';

/**
 * CoffeePOS - Analytics Dashboard
 *
 * Main dashboard for the owner with stats, charts, and tables.
 * Uses recharts for data visualization.
 * All text Ukrainian.
 */

import { useMemo, useState, useEffect } from 'react';
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
import { Text, Icon, GlassCard, Badge, Spinner } from '@/components/atoms';
import { useDailyReport, useMonthlyReport, useCurrentShift } from '@/lib/hooks';
import styles from './page.module.css';

// ============================================
// HELPERS
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

const PAYMENT_COLORS_FALLBACK = ['#30B350', '#007AFF', '#FF9500', '#A0A0A0'];
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Готівка',
  card: 'Картка',
  qr: 'QR',
  other: 'Інше',
};

// ============================================
// COMPONENT
// ============================================

export default function DashboardPage() {
  // Read design system colors for recharts (which needs raw color strings)
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

  // Fetch today's daily report
  const { data: dailyReport, isLoading: isDailyLoading } = useDailyReport(todayKey);

  // Fetch current month for chart data
  const { data: monthlyReport, isLoading: isMonthlyLoading } = useMonthlyReport(
    today.getFullYear(),
    today.getMonth() + 1
  );

  // Get current shift for "active shifts" count
  const { data: currentShift } = useCurrentShift();

  // Stats
  const todayRevenue = dailyReport?.summary?.totalRevenue || 0;
  const todayOrders = dailyReport?.summary?.ordersCount || 0;
  const todayAvgOrder = dailyReport?.summary?.avgOrder || 0;
  const activeShifts = currentShift && currentShift.status === 'open' ? 1 : 0;

  // Revenue chart data — last 7 days from monthly data
  const revenueChartData = useMemo(() => {
    if (!monthlyReport?.days) return [];

    const todayDate = new Date();
    const last7Days: { date: string; revenue: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayData = monthlyReport.days.find((day) => day.date === key);
      last7Days.push({
        date: getShortDate(key),
        revenue: dayData?.revenue || 0,
      });
    }

    return last7Days;
  }, [monthlyReport]);

  // Payment breakdown pie data
  const paymentPieData = useMemo(() => {
    if (!dailyReport?.paymentBreakdown) {
      return [
        { name: 'Готівка', value: 35, key: 'cash' },
        { name: 'Картка', value: 55, key: 'card' },
        { name: 'QR', value: 10, key: 'qr' },
      ];
    }

    const { cash, card, qr, other } = dailyReport.paymentBreakdown;
    const data = [];
    if (cash > 0) data.push({ name: PAYMENT_LABELS.cash, value: cash, key: 'cash' });
    if (card > 0) data.push({ name: PAYMENT_LABELS.card, value: card, key: 'card' });
    if (qr > 0) data.push({ name: PAYMENT_LABELS.qr, value: qr, key: 'qr' });
    if (other > 0) data.push({ name: PAYMENT_LABELS.other, value: other, key: 'other' });

    return data.length > 0
      ? data
      : [{ name: 'Немає даних', value: 1, key: 'none' }];
  }, [dailyReport]);

  // Top products
  const topProducts = useMemo(() => {
    return (dailyReport?.topProducts || []).slice(0, 5);
  }, [dailyReport]);

  // Recent orders
  const recentOrders = useMemo(() => {
    if (!dailyReport?.orders) return [];
    return dailyReport.orders.slice(0, 5).map((order: any) => ({
      id: order.id || order.documentId,
      number: order.orderNumber || order.number || `#${order.id}`,
      time: order.createdAt
        ? new Date(order.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        : '--:--',
      total: parseFloat(order.total) || 0,
      status: order.status || 'completed',
    }));
  }, [dailyReport]);

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

  const isLoading = isDailyLoading || isMonthlyLoading;

  // Custom tooltip for line chart
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

  return (
    <div className={styles.page}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <GlassCard className={styles.statCard} elevated>
          <div className={styles.statHeader}>
            <div className={`${styles.statIconWrap} ${styles.statIconSuccess}`}>
              <Icon name="cash" size="sm" color="success" />
            </div>
            <Text variant="labelSmall" color="tertiary">Виторг сьогодні</Text>
          </div>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
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
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
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
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
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
        {/* Revenue Line Chart */}
        <GlassCard className={styles.chartSection} elevated>
          <div className={styles.chartTitle}>
            <Icon name="chart" size="sm" color="accent" />
            <Text variant="h5" weight="semibold">Виторг за 7 днів</Text>
          </div>
          <div className={styles.chartContainer}>
            {isMonthlyLoading ? (
              <div className={styles.loadingState}>
                <Spinner size="md" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: chartColors.textSecondary }}
                    axisLine={{ stroke: chartColors.gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: chartColors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColors.brand}
                    strokeWidth={2.5}
                    dot={{ fill: chartColors.brand, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: chartColors.brand, strokeWidth: 2, stroke: chartColors.white }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Payment Methods Pie Chart */}
        <GlassCard className={styles.chartSection} elevated>
          <div className={styles.chartTitle}>
            <Icon name="card" size="sm" color="info" />
            <Text variant="h5" weight="semibold">Оплата сьогодні</Text>
          </div>
          <div className={styles.pieChartContainer}>
            {isDailyLoading ? (
              <Spinner size="md" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors.paymentColors[index % chartColors.paymentColors.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value: string) => (
                      <span className={styles.legendText}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [`\u20B4${formatCurrency(value || 0)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Top Products + Recent Orders */}
      <div className={styles.bottomRow}>
        {/* Top Products */}
        <GlassCard className={styles.tableSection} elevated>
          <div className={styles.tableTitle}>
            <Icon name="star" size="sm" color="warning" />
            <Text variant="h5" weight="semibold">Топ продукти</Text>
          </div>
          {isDailyLoading ? (
            <div className={styles.loadingState}>
              <Spinner size="md" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon name="package" size="xl" color="tertiary" />
              <Text variant="bodySmall" color="tertiary">Немає даних за сьогодні</Text>
            </div>
          ) : (
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Кількість</th>
                  <th>Виторг</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr key={product.name}>
                    <td>
                      <span className={styles.productRank}>{idx + 1}</span>
                      {product.name}
                    </td>
                    <td>{product.quantity} шт.</td>
                    <td>{'\u20B4'}{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>

        {/* Recent Orders */}
        <GlassCard className={styles.tableSection} elevated>
          <div className={styles.tableTitle}>
            <Icon name="receipt" size="sm" color="accent" />
            <Text variant="h5" weight="semibold">Останні замовлення</Text>
          </div>
          {isDailyLoading ? (
            <div className={styles.loadingState}>
              <Spinner size="md" />
            </div>
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
                    <Badge variant={statusVariant(order.status)} size="sm">
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
