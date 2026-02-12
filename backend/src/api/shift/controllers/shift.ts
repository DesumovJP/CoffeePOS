import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::shift.shift', ({ strapi }) => ({
  /**
   * Open a new shift
   */
  async openShift(ctx) {
    const { openingCash, openedBy } = ctx.request.body?.data || {};

    if (!openedBy) {
      return ctx.badRequest('openedBy is required');
    }

    // Check no open shift exists
    const existingOpen = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });

    if (existingOpen) {
      return ctx.badRequest('A shift is already open. Close it before opening a new one.');
    }

    const shift = await strapi.db.query('api::shift.shift').create({
      data: {
        openedAt: new Date().toISOString(),
        openedBy,
        openingCash: openingCash || 0,
        status: 'open',
        cashSales: 0,
        cardSales: 0,
        totalSales: 0,
        ordersCount: 0,
        writeOffsTotal: 0,
        suppliesTotal: 0,
      },
    });

    return { data: shift };
  },

  /**
   * Close an open shift
   */
  async closeShift(ctx) {
    const { id } = ctx.params;
    const { closingCash, closedBy, notes } = ctx.request.body?.data || {};

    if (!closedBy) {
      return ctx.badRequest('closedBy is required');
    }

    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { id },
    });

    if (!shift) {
      return ctx.notFound('Shift not found');
    }

    if (shift.status === 'closed') {
      return ctx.badRequest('Shift is already closed');
    }

    const updated = await strapi.db.query('api::shift.shift').update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy,
        closingCash: closingCash || 0,
        notes: notes || shift.notes,
      },
    });

    return { data: updated };
  },

  /**
   * Get the currently open shift
   */
  async getCurrentShift(ctx) {
    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });

    return { data: shift || null };
  },
}));
