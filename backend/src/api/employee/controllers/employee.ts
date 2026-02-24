import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::employee.employee', ({ strapi }) => ({
  /**
   * GET /api/employees/:id/stats?month=M&year=YYYY
   * Returns employee performance stats filtered to the given month (defaults to current).
   */
  async stats(ctx) {
    const { id } = ctx.params;

    const now = new Date();
    const month = parseInt((ctx.query as any).month as string) || (now.getMonth() + 1);
    const year  = parseInt((ctx.query as any).year  as string) || now.getFullYear();

    // Month date range (UTC-safe: use start of day in local server time)
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month, 1); // exclusive

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { documentId: id },
    });

    if (!employee) {
      return ctx.notFound('Employee not found');
    }

    const name = employee.name;

    // Get ALL shifts by this employee (to find open ones crossing month boundaries)
    const allShifts = await strapi.db.query('api::shift.shift').findMany({
      where: { openedBy: name },
      orderBy: { openedAt: 'desc' },
    });

    // Filter shifts that overlap with the selected month
    const shifts = allShifts.filter((s) => {
      const start = new Date(s.openedAt).getTime();
      const end   = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
      return start < monthEnd.getTime() && end >= monthStart.getTime();
    });

    const totalShifts = shifts.length;
    let totalHours = 0;
    shifts.forEach((s) => {
      // Clamp hours to the selected month window
      const start = Math.max(new Date(s.openedAt).getTime(), monthStart.getTime());
      const end   = Math.min(
        s.closedAt ? new Date(s.closedAt).getTime() : Date.now(),
        monthEnd.getTime()
      );
      totalHours += Math.max(0, end - start) / (1000 * 60 * 60);
    });

    // Get completed orders within the month
    const orders = await strapi.db.query('api::order.order').findMany({
      where: {
        status: 'completed',
        createdAt: { $gte: monthStart.toISOString(), $lt: monthEnd.toISOString() },
      },
    });

    // Filter to orders that fall within this employee's shifts
    const myOrders = orders.filter((o) => {
      const oTime = new Date(o.createdAt).getTime();
      return shifts.some((s) => {
        const start = new Date(s.openedAt).getTime();
        const end   = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
        return oTime >= start && oTime <= end;
      });
    });

    const totalOrders = myOrders.length;
    const totalSales  = myOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Daily breakdown — all days in the selected month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailySales: { date: string; sales: number }[]  = [];
    const dailyHours: { date: string; hours: number }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month - 1, day);
      const dayEnd   = new Date(year, month - 1, day + 1);
      const key      = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shortDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;

      const daySales = myOrders
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= dayStart.getTime() && t < dayEnd.getTime();
        })
        .reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

      const dayHours = shifts
        .filter((s) => {
          const start = new Date(s.openedAt).getTime();
          return start >= dayStart.getTime() && start < dayEnd.getTime();
        })
        .reduce((sum, s) => {
          const start = Math.max(new Date(s.openedAt).getTime(), dayStart.getTime());
          const end   = Math.min(
            s.closedAt ? new Date(s.closedAt).getTime() : Date.now(),
            dayEnd.getTime()
          );
          return sum + Math.max(0, end - start) / (1000 * 60 * 60);
        }, 0);

      dailySales.push({ date: shortDate, sales: Math.round(daySales) });
      dailyHours.push({ date: shortDate, hours: Math.round(dayHours * 10) / 10 });
    }

    return {
      data: {
        totalShifts,
        totalHours:   Math.round(totalHours * 10) / 10,
        totalOrders,
        totalSales:   Math.round(totalSales),
        avgOrderValue: Math.round(avgOrderValue),
        dailySales,
        dailyHours,
        month,
        year,
      },
    };
  },

  /**
   * GET /api/employees/performance
   * Returns performance data for all active employees
   */
  async performance(ctx) {
    const employees = await strapi.db.query('api::employee.employee').findMany({
      where: { isActive: true },
    });

    const allShifts = await strapi.db.query('api::shift.shift').findMany({
      orderBy: { openedAt: 'desc' },
    });

    const allOrders = await strapi.db.query('api::order.order').findMany({
      where: { status: 'completed' },
    });

    const performance = employees.map((emp) => {
      const myShifts = allShifts.filter((s) => s.openedBy === emp.name);

      let totalHours = 0;
      myShifts.forEach((s) => {
        const start = new Date(s.openedAt).getTime();
        const end = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
        totalHours += (end - start) / (1000 * 60 * 60);
      });

      const myOrders = allOrders.filter((o) => {
        const oTime = new Date(o.createdAt).getTime();
        return myShifts.some((s) => {
          const start = new Date(s.openedAt).getTime();
          const end = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
          return oTime >= start && oTime <= end;
        });
      });

      const totalOrders = myOrders.length;
      const totalSales = myOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        totalSales: Math.round(totalSales),
        totalHours: Math.round(totalHours * 10) / 10,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
        shiftsCount: myShifts.length,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    return { data: performance };
  },
}));
