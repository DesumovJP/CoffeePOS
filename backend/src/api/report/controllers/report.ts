/**
 * Report controller - Virtual API (no content type)
 * Aggregates data from orders, shifts, and inventory
 */

export default {
  /**
   * GET /reports/daily?date=YYYY-MM-DD
   */
  async daily(ctx) {
    const { date } = ctx.query;

    if (!date) {
      return ctx.badRequest('date query parameter is required (YYYY-MM-DD)');
    }

    const strapi = (global as any).strapi;
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

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

    // Calculate totals
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
    const cashSales = orders.reduce((sum: number, o: any) => {
      if (o.payment?.method === 'cash') return sum + (parseFloat(o.total) || 0);
      return sum;
    }, 0);
    const cardSales = totalRevenue - cashSales;
    const writeOffsTotal = writeOffs.reduce((sum: number, w: any) => sum + (parseFloat(w.totalCost) || 0), 0);

    return {
      data: {
        date,
        orders,
        shifts: allShifts,
        writeOffs,
        summary: {
          totalRevenue,
          ordersCount: orders.length,
          cashSales,
          cardSales,
          writeOffsTotal,
          avgOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
        },
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
    const startOfMonth = new Date(y, m, 1).toISOString();
    const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();

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

    // Group by day
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const dailyData: Record<string, any> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dailyData[dateKey] = {
        date: dateKey,
        revenue: 0,
        ordersCount: 0,
        cashSales: 0,
        cardSales: 0,
        writeOffsTotal: 0,
        shiftsCount: 0,
      };
    }

    for (const order of orders) {
      const dateKey = order.createdAt.split('T')[0];
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
      const dateKey = shift.openedAt.split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].shiftsCount += 1;
      }
    }

    for (const wo of writeOffs) {
      const dateKey = wo.createdAt.split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].writeOffsTotal += parseFloat(wo.totalCost) || 0;
      }
    }

    // Month summary
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
    const totalOrders = orders.length;

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
        },
      },
    };
  },
};
