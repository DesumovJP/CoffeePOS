import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::employee.employee', ({ strapi }) => ({
  /**
   * GET /api/employees/:id/stats
   * Returns employee performance stats from shift and order data
   */
  async stats(ctx) {
    const { id } = ctx.params;

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { documentId: id },
    });

    if (!employee) {
      return ctx.notFound('Employee not found');
    }

    const name = employee.name;

    // Get shifts by this employee
    const shifts = await strapi.db.query('api::shift.shift').findMany({
      where: { openedBy: name },
      orderBy: { openedAt: 'desc' },
    });

    const totalShifts = shifts.length;
    let totalHours = 0;
    shifts.forEach((s) => {
      const start = new Date(s.openedAt).getTime();
      const end = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
      totalHours += (end - start) / (1000 * 60 * 60);
    });

    // Get orders from this employee's shifts
    const orders = await strapi.db.query('api::order.order').findMany({
      where: { status: 'completed' },
    });

    // Filter orders that fall within this employee's shift periods
    const myOrders = orders.filter((o) => {
      const oTime = new Date(o.createdAt).getTime();
      return shifts.some((s) => {
        const start = new Date(s.openedAt).getTime();
        const end = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
        return oTime >= start && oTime <= end;
      });
    });

    const totalOrders = myOrders.length;
    const totalSales = myOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Daily breakdown for last 7 days
    const now = new Date();
    const dailySales = [];
    const dailyHours = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const shortDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

      const daySales = myOrders
        .filter((o) => o.createdAt && o.createdAt.toString().startsWith(key))
        .reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

      const dayHours = shifts
        .filter((s) => s.openedAt && s.openedAt.toString().startsWith(key))
        .reduce((sum, s) => {
          const start = new Date(s.openedAt).getTime();
          const end = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0);

      dailySales.push({ date: shortDate, sales: Math.round(daySales) });
      dailyHours.push({ date: shortDate, hours: Math.round(dayHours * 10) / 10 });
    }

    return {
      data: {
        totalShifts,
        totalHours: Math.round(totalHours * 10) / 10,
        totalOrders,
        totalSales: Math.round(totalSales),
        avgOrderValue: Math.round(avgOrderValue),
        dailySales,
        dailyHours,
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
