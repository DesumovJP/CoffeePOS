import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::write-off.write-off', ({ strapi }) => ({
  async create(ctx) {
    const { type, items, reason, performedBy } = ctx.request.body?.data || {};

    if (!type) return ctx.badRequest('type is required');
    if (!Array.isArray(items) || items.length === 0) return ctx.badRequest('items array is required');
    if (!performedBy) return ctx.badRequest('performedBy is required');

    // Get current open shift
    const currentShift = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });

    // Calculate total cost and deduct ingredients
    let totalCost = 0;

    for (const item of items) {
      if (!item.ingredientId || !item.quantity || item.quantity <= 0) continue;

      const ingredient = await strapi.db.query('api::ingredient.ingredient').findOne({
        where: { id: item.ingredientId },
      });
      if (!ingredient) continue;

      const deductAmount = item.quantity;
      const previousQty = ingredient.quantity || 0;
      const newQty = Math.max(0, previousQty - deductAmount);
      const itemCost = deductAmount * (ingredient.costPerUnit || 0);
      totalCost += itemCost;

      // Update ingredient quantity
      await strapi.db.query('api::ingredient.ingredient').update({
        where: { id: ingredient.id },
        data: { quantity: newQty },
      });

      // Create inventory transaction
      await strapi.db.query('api::inventory-transaction.inventory-transaction').create({
        data: {
          type: 'writeoff',
          ingredient: ingredient.id,
          quantity: -deductAmount,
          previousQty,
          newQty,
          reference: `WO-${Date.now()}`,
          performedBy,
          shift: currentShift?.id || undefined,
          notes: reason || `Write-off: ${type}`,
        },
      });
    }

    // Create the write-off record
    const writeOff = await strapi.db.query('api::write-off.write-off').create({
      data: {
        type,
        items,
        totalCost,
        reason: reason || '',
        performedBy,
        shift: currentShift?.id || undefined,
      },
    });

    // Update shift write-offs total
    if (currentShift) {
      const shiftService = strapi.service('api::shift.shift');
      await (shiftService as any).addWriteOff(currentShift.id, totalCost);
    }

    return { data: writeOff };
  },
}));
