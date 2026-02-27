/**
 * Report controller - Virtual API (no content type)
 * Aggregates data from orders, shifts, and inventory
 *
 * All date/time boundaries use Kyiv timezone (Europe/Kiev = UTC+2 winter / UTC+3 summer).
 */

// ============================================================
// Kyiv timezone helpers
// ============================================================
const KYIV_TZ = 'Europe/Kiev';

/** Convert a UTC ISO string to Kyiv local date (YYYY-MM-DD). */
function toKyivDate(isoString: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: KYIV_TZ }).format(new Date(isoString));
}

/** Return the UTC ISO string for Kyiv midnight (00:00:00) on a given Kyiv date. */
function kyivDayStartUTC(kyivDateStr: string): string {
  for (const offset of ['+02:00', '+03:00']) {
    const candidate = new Date(`${kyivDateStr}T00:00:00.000${offset}`);
    if (toKyivDate(candidate.toISOString()) !== kyivDateStr) continue;
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: KYIV_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' }).format(candidate),
      10
    );
    if (hour === 0) return candidate.toISOString();
  }
  return new Date(`${kyivDateStr}T00:00:00.000+02:00`).toISOString();
}

/** Return the UTC ISO string for Kyiv 23:59:59.999 on a given Kyiv date. */
function kyivDayEndUTC(kyivDateStr: string): string {
  for (const offset of ['+02:00', '+03:00']) {
    const candidate = new Date(`${kyivDateStr}T23:59:59.999${offset}`);
    if (toKyivDate(candidate.toISOString()) !== kyivDateStr) continue;
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: KYIV_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' }).format(candidate),
      10
    );
    if (hour === 23) return candidate.toISOString();
  }
  return new Date(`${kyivDateStr}T23:59:59.999+02:00`).toISOString();
}

export default {
  /**
   * GET /reports/daily?date=YYYY-MM-DD  (date is a Kyiv calendar date)
   */
  async daily(ctx) {
    const { date } = ctx.query;

    if (!date) {
      return ctx.badRequest('date query parameter is required (YYYY-MM-DD)');
    }

    const strapi = (global as any).strapi;
    const startOfDay = kyivDayStartUTC(date as string);
    const endOfDay = kyivDayEndUTC(date as string);

    // Get orders for the day
    const orders = await strapi.db.query('api::order.order').findMany({
      where: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
      populate: ['items', 'payment', 'shift'],
      orderBy: { createdAt: 'desc' },
    });

    // Get shifts for the day
    const shifts = await strapi.db.query('api::shift.shift').findMany({
      where: {
        openedAt: { $gte: startOfDay, $lte: endOfDay },
      },
      orderBy: { openedAt: 'asc' },
    });

    // Also get shifts that started before but were open during the day
    const carryOverShifts = await strapi.db.query('api::shift.shift').findMany({
      where: {
        openedAt: { $lt: startOfDay },
        $or: [
          { closedAt: { $gte: startOfDay } },
          { status: 'open' },
        ],
      },
    });

    const allShifts = [...carryOverShifts, ...shifts];

    // Get write-offs for the day
    const writeOffs = await strapi.db.query('api::write-off.write-off').findMany({
      where: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    });

    // Get supplies for the day
    const supplies = await strapi.db.query('api::supply.supply').findMany({
      where: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate activities from all shifts
    const activities: any[] = [];
    for (const shift of allShifts) {
      if (Array.isArray(shift.activities)) {
        activities.push(...shift.activities);
      }
    }
    activities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate totals
    const completedOrders = orders.filter((o: any) => o.status !== 'cancelled');
    const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
    const cashSales = completedOrders.reduce((sum: number, o: any) => {
      if (o.payment?.method === 'cash') return sum + (parseFloat(o.total) || 0);
      return sum;
    }, 0);
    const cardSales = totalRevenue - cashSales;
    const writeOffsTotal = writeOffs.reduce((sum: number, w: any) => sum + (parseFloat(w.totalCost) || 0), 0);

    // Top products by quantity sold (aggregate from order items)
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of completedOrders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const key = item.productName || item.name || `product-${item.product}`;
        if (!productMap[key]) {
          productMap[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productMap[key].quantity += item.quantity || 1;
        productMap[key].revenue += (item.unitPrice || 0) * (item.quantity || 1);
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Payment breakdown
    const paymentBreakdown = { cash: 0, card: 0, qr: 0, other: 0 };
    for (const order of completedOrders) {
      const total = parseFloat(order.total) || 0;
      const method = order.payment?.method || 'other';
      if (method === 'cash') paymentBreakdown.cash += total;
      else if (method === 'card') paymentBreakdown.card += total;
      else if (method === 'qr') paymentBreakdown.qr += total;
      else paymentBreakdown.other += total;
    }

    // Order type breakdown
    const orderTypeBreakdown = { dine_in: 0, takeaway: 0, delivery: 0 };
    for (const order of completedOrders) {
      const type = order.type || order.orderType || 'dine_in';
      if (type === 'dine_in' || type === 'dine-in') orderTypeBreakdown.dine_in += 1;
      else if (type === 'takeaway' || type === 'take-away') orderTypeBreakdown.takeaway += 1;
      else if (type === 'delivery') orderTypeBreakdown.delivery += 1;
    }

    const suppliesTotal = supplies.reduce((sum: number, s: any) => sum + (parseFloat(s.totalCost) || 0), 0);

    return {
      data: {
        date,
        orders,
        shifts: allShifts,
        writeOffs,
        supplies,
        activities,
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

  /**
   * GET /reports/monthly?year=YYYY&month=MM
   */
  async monthly(ctx) {
    const { year, month } = ctx.query;

    if (!year || !month) {
      return ctx.badRequest('year and month query parameters are required');
    }

    const strapi = (global as any).strapi;
    const y = parseInt(year as string);
    const m = parseInt(month as string) - 1; // JS months are 0-indexed
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const mm = String(m + 1).padStart(2, '0');
    const startOfMonth = kyivDayStartUTC(`${y}-${mm}-01`);
    const endOfMonth = kyivDayEndUTC(`${y}-${mm}-${String(daysInMonth).padStart(2, '0')}`);

    // Get all orders for the month
    const orders = await strapi.db.query('api::order.order').findMany({
      where: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
      populate: ['payment'],
      orderBy: { createdAt: 'asc' },
    });

    // Get all shifts for the month
    const shifts = await strapi.db.query('api::shift.shift').findMany({
      where: {
        openedAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
      orderBy: { openedAt: 'asc' },
    });

    // Get all write-offs for the month
    const writeOffs = await strapi.db.query('api::write-off.write-off').findMany({
      where: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
    });

    // Get all supplies for the month
    const monthlySupplies = await strapi.db.query('api::supply.supply').findMany({
      where: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: 'received',
      },
    });

    // Get previous month orders for comparison
    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const prevDaysInMonth = new Date(prevY, prevM + 1, 0).getDate();
    const pmm = String(prevM + 1).padStart(2, '0');
    const startOfPrevMonth = kyivDayStartUTC(`${prevY}-${pmm}-01`);
    const endOfPrevMonth = kyivDayEndUTC(`${prevY}-${pmm}-${String(prevDaysInMonth).padStart(2, '0')}`);

    const prevMonthOrders = await strapi.db.query('api::order.order').findMany({
      where: {
        createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        status: { $ne: 'cancelled' },
      },
    });

    const previousMonthRevenue = prevMonthOrders.reduce(
      (sum: number, o: any) => sum + (parseFloat(o.total) || 0),
      0
    );

    // Group by Kyiv calendar day
    const dailyData: Record<string, any> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${y}-${mm}-${String(d).padStart(2, '0')}`;
      dailyData[dateKey] = {
        date: dateKey,
        revenue: 0,
        ordersCount: 0,
        cashSales: 0,
        cardSales: 0,
        writeOffsTotal: 0,
        suppliesTotal: 0,
        shiftsCount: 0,
      };
    }

    for (const order of orders) {
      const dateKey = toKyivDate(order.createdAt);
      if (dailyData[dateKey]) {
        const total = parseFloat(order.total) || 0;
        dailyData[dateKey].revenue += total;
        dailyData[dateKey].ordersCount += 1;
        if (order.payment?.method === 'cash') {
          dailyData[dateKey].cashSales += total;
        } else {
          dailyData[dateKey].cardSales += total;
        }
      }
    }

    for (const shift of shifts) {
      const dateKey = toKyivDate(shift.openedAt);
      if (dailyData[dateKey]) {
        dailyData[dateKey].shiftsCount += 1;
      }
    }

    for (const wo of writeOffs) {
      const dateKey = toKyivDate(wo.createdAt);
      if (dailyData[dateKey]) {
        dailyData[dateKey].writeOffsTotal += parseFloat(wo.totalCost) || 0;
      }
    }

    for (const supply of monthlySupplies) {
      const dateKey = toKyivDate(supply.createdAt);
      if (dailyData[dateKey]) {
        dailyData[dateKey].suppliesTotal += parseFloat(supply.totalCost) || 0;
      }
    }

    // Month summary
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
    const totalOrders = orders.length;

    // Revenue change percentage
    const revenueChange = previousMonthRevenue > 0
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;

    return {
      data: {
        year: y,
        month: m + 1,
        days: Object.values(dailyData),
        summary: {
          totalRevenue,
          totalOrders,
          avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          totalShifts: shifts.length,
          totalWriteOffs: writeOffs.reduce((sum: number, w: any) => sum + (parseFloat(w.totalCost) || 0), 0),
          previousMonthRevenue,
          revenueChange: Math.round(revenueChange * 100) / 100,
        },
      },
    };
  },

  /**
   * GET /reports/products?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Returns product analytics for the given period
   */
  async products(ctx) {
    const { from, to } = ctx.query;

    if (!from || !to) {
      return ctx.badRequest('from and to query parameters are required (YYYY-MM-DD)');
    }

    const strapi = (global as any).strapi;
    const startDate = kyivDayStartUTC(from as string);
    const endDate = kyivDayEndUTC(to as string);

    // Get completed orders with items
    const orders = await strapi.db.query('api::order.order').findMany({
      where: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
      },
      populate: ['items'],
    });

    // Aggregate product data
    const productMap: Record<string, {
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
    }> = {};

    for (const order of orders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const key = String(item.product || item.productName || item.name);
        if (!productMap[key]) {
          productMap[key] = {
            productId: String(item.product || ''),
            productName: item.productName || item.name || `Товар ${item.product}`,
            quantitySold: 0,
            revenue: 0,
          };
        }
        productMap[key].quantitySold += item.quantity || 1;
        productMap[key].revenue += (item.unitPrice || 0) * (item.quantity || 1);
      }
    }

    // Calculate avg price and sort by revenue
    const products = Object.values(productMap)
      .map((p) => ({
        ...p,
        avgPrice: p.quantitySold > 0 ? p.revenue / p.quantitySold : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      data: {
        from,
        to,
        products,
      },
    };
  },

  /**
   * GET /reports/x-report?shiftId=ID
   * Current shift stats (mid-shift report)
   */
  async xReport(ctx) {
    const { shiftId } = ctx.query;

    if (!shiftId) {
      return ctx.badRequest('shiftId query parameter is required');
    }

    const strapi = (global as any).strapi;

    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { id: shiftId },
    });

    if (!shift) {
      return ctx.notFound('Shift not found');
    }

    // Get orders for this shift
    const orders = await strapi.db.query('api::order.order').findMany({
      where: { shift: shiftId, status: { $ne: 'cancelled' } },
      populate: ['payment'],
    });

    const cashSales = orders.reduce((sum: number, o: any) => {
      if (o.payment?.method === 'cash') return sum + (parseFloat(o.total) || 0);
      return sum;
    }, 0);
    const cardSales = orders.reduce((sum: number, o: any) => {
      if (o.payment?.method === 'card') return sum + (parseFloat(o.total) || 0);
      return sum;
    }, 0);
    const totalSales = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

    // Get write-offs for this shift period
    const writeOffs = await strapi.db.query('api::write-off.write-off').findMany({
      where: {
        createdAt: {
          $gte: shift.openedAt,
          ...(shift.closedAt ? { $lte: shift.closedAt } : {}),
        },
      },
    });
    const writeOffsTotal = writeOffs.reduce((sum: number, w: any) => sum + (parseFloat(w.totalCost) || 0), 0);

    // Get supplies for this shift period
    const supplies = await strapi.db.query('api::supply.supply').findMany({
      where: {
        createdAt: {
          $gte: shift.openedAt,
          ...(shift.closedAt ? { $lte: shift.closedAt } : {}),
        },
      },
    });
    const suppliesTotal = supplies.reduce((sum: number, s: any) => sum + (parseFloat(s.totalCost) || 0), 0);

    const openingCash = parseFloat(shift.openingCash) || 0;
    const expectedCash = openingCash + cashSales;

    // Duration in hours
    const openedAt = new Date(shift.openedAt);
    const now = shift.closedAt ? new Date(shift.closedAt) : new Date();
    const duration = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);

    return {
      data: {
        shiftId,
        openedAt: shift.openedAt,
        openedBy: shift.openedBy || '',
        openingCash,
        cashSales,
        cardSales,
        totalSales,
        ordersCount: orders.length,
        writeOffsTotal,
        suppliesTotal,
        expectedCash,
        duration: Math.round(duration * 100) / 100,
      },
    };
  },

  /**
   * GET /reports/z-report?shiftId=ID
   * End-of-shift report (same as X-report plus closing data)
   */
  async zReport(ctx) {
    const { shiftId } = ctx.query;

    if (!shiftId) {
      return ctx.badRequest('shiftId query parameter is required');
    }

    const strapi = (global as any).strapi;

    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { id: shiftId },
    });

    if (!shift) {
      return ctx.notFound('Shift not found');
    }

    // Get orders for this shift
    const orders = await strapi.db.query('api::order.order').findMany({
      where: { shift: shiftId, status: { $ne: 'cancelled' } },
      populate: ['payment'],
    });

    const cashSales = orders.reduce((sum: number, o: any) => {
      if (o.payment?.method === 'cash') return sum + (parseFloat(o.total) || 0);
      return sum;
    }, 0);
    const cardSales = orders.reduce((sum: number, o: any) => {
      if (o.payment?.method === 'card') return sum + (parseFloat(o.total) || 0);
      return sum;
    }, 0);
    const totalSales = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

    // Get write-offs for this shift period
    const writeOffs = await strapi.db.query('api::write-off.write-off').findMany({
      where: {
        createdAt: {
          $gte: shift.openedAt,
          ...(shift.closedAt ? { $lte: shift.closedAt } : {}),
        },
      },
    });
    const writeOffsTotal = writeOffs.reduce((sum: number, w: any) => sum + (parseFloat(w.totalCost) || 0), 0);

    // Get supplies for this shift period
    const supplies = await strapi.db.query('api::supply.supply').findMany({
      where: {
        createdAt: {
          $gte: shift.openedAt,
          ...(shift.closedAt ? { $lte: shift.closedAt } : {}),
        },
      },
    });
    const suppliesTotal = supplies.reduce((sum: number, s: any) => sum + (parseFloat(s.totalCost) || 0), 0);

    const openingCash = parseFloat(shift.openingCash) || 0;
    const closingCash = parseFloat(shift.closingCash) || 0;
    const expectedCash = openingCash + cashSales;
    const cashDifference = closingCash - expectedCash;

    // Duration in hours
    const openedAt = new Date(shift.openedAt);
    const closedAt = shift.closedAt ? new Date(shift.closedAt) : new Date();
    const duration = (closedAt.getTime() - openedAt.getTime()) / (1000 * 60 * 60);

    return {
      data: {
        shiftId,
        openedAt: shift.openedAt,
        openedBy: shift.openedBy || '',
        openingCash,
        cashSales,
        cardSales,
        totalSales,
        ordersCount: orders.length,
        writeOffsTotal,
        suppliesTotal,
        expectedCash,
        duration: Math.round(duration * 100) / 100,
        closedAt: shift.closedAt || null,
        closedBy: shift.closedBy || '',
        closingCash,
        cashDifference,
      },
    };
  },
};
