import { factories } from '@strapi/strapi';
import { validateRequired, sanitizeString, ValidationError } from '../../../utils/validate';

export default factories.createCoreController('api::supply.supply', ({ strapi }) => ({
  /**
   * Receive a supply: update ingredient quantities and create transactions
   */
  async receive(ctx) {
    const { id } = ctx.params;
    const { receivedBy } = ctx.request.body?.data || {};

    try {
      validateRequired({ receivedBy }, ['receivedBy']);
      if (typeof receivedBy !== 'string') {
        throw new ValidationError('receivedBy must be a string', { receivedBy: 'Must be a string' });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message, { details: error.details });
      }
      throw error;
    }

    const supply = await strapi.db.query('api::supply.supply').findOne({
      where: { id },
    });

    if (!supply) {
      return ctx.notFound('Supply not found');
    }

    if (supply.status === 'received') {
      return ctx.badRequest('Supply is already received');
    }

    if (supply.status === 'cancelled') {
      return ctx.badRequest('Cannot receive a cancelled supply');
    }

    const supplyItems = supply.items;
    if (!Array.isArray(supplyItems)) {
      return ctx.badRequest('Supply has no items');
    }

    // Get current open shift
    const currentShift = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });

    // Add stock to each ingredient
    for (const item of supplyItems) {
      if (!item.ingredientId || !item.quantity) continue;

      const ingredient = await strapi.db.query('api::ingredient.ingredient').findOne({
        where: { id: item.ingredientId },
      });

      if (!ingredient) continue;

      const previousQty = ingredient.quantity || 0;
      const newQty = previousQty + item.quantity;

      await strapi.db.query('api::ingredient.ingredient').update({
        where: { id: ingredient.id },
        data: { quantity: newQty },
      });

      await strapi.db.query('api::inventory-transaction.inventory-transaction').create({
        data: {
          type: 'supply',
          ingredient: ingredient.id,
          quantity: item.quantity,
          previousQty,
          newQty,
          reference: `SUP-${id}`,
          performedBy: sanitizeString(receivedBy),
          shift: currentShift?.id || undefined,
        },
      });
    }

    // Update supply status
    const updated = await strapi.db.query('api::supply.supply').update({
      where: { id },
      data: {
        status: 'received',
        receivedAt: new Date().toISOString(),
        receivedBy: sanitizeString(receivedBy),
      },
    });

    // Update shift supplies total
    if (currentShift) {
      const shiftService = strapi.service('api::shift.shift') as any;
      await shiftService.addSupply(currentShift.id, supply.totalCost || 0);
      await shiftService.logActivity(currentShift.id, 'supply_receive', {
        supplyId: id,
        supplierName: supply.supplierName || '',
        items: supplyItems.map((item: any) => ({
          name: item.ingredientName || item.name || '',
          quantity: item.quantity || 0,
          unitCost: item.unitCost || 0,
        })),
        totalCost: supply.totalCost || 0,
      });
    }

    return { data: updated };
  },
}));
