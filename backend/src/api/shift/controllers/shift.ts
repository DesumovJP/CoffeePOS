import { factories } from '@strapi/strapi';
import { validateRequired, validateNumber, sanitizeString, ValidationError } from '../../../utils/validate';

export default factories.createCoreController('api::shift.shift', ({ strapi }) => ({
  /**
   * Open a new shift
   */
  async openShift(ctx) {
    const { openingCash, openedBy } = ctx.request.body?.data || {};

    try {
      validateRequired({ openedBy }, ['openedBy']);
      if (typeof openedBy !== 'string') {
        throw new ValidationError('openedBy must be a string', { openedBy: 'Must be a string' });
      }
      if (openingCash !== undefined && openingCash !== null) {
        validateNumber(openingCash, 'openingCash', { min: 0 });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message, { details: error.details });
      }
      throw error;
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
        openedBy: sanitizeString(openedBy),
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

    try {
      validateRequired({ closedBy }, ['closedBy']);
      if (typeof closedBy !== 'string') {
        throw new ValidationError('closedBy must be a string', { closedBy: 'Must be a string' });
      }
      if (closingCash !== undefined && closingCash !== null) {
        validateNumber(closingCash, 'closingCash', { min: 0 });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message, { details: error.details });
      }
      throw error;
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
        closedBy: sanitizeString(closedBy),
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
