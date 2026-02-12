import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  /**
   * Create order with items, payment, inventory deduction, and shift tracking
   */
  async create(ctx) {
    const { order, items, payment } = ctx.request.body?.data || {};

    if (!order) {
      return ctx.badRequest('Order data is required');
    }

    // Get current open shift
    const currentShift = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });

    // Create the order
    const createdOrder = await strapi.db.query('api::order.order').create({
      data: {
        ...order,
        shift: currentShift?.id || undefined,
      },
    });

    const orderId = createdOrder.id;

    // Create order items
    if (Array.isArray(items)) {
      await Promise.all(
        items.map((item: any) =>
          strapi.db.query('api::order-item.order-item').create({
            data: { ...item, order: orderId },
          })
        )
      );
    }

    // Create payment if provided
    if (payment) {
      await strapi.db.query('api::payment.payment').create({
        data: {
          ...payment,
          order: orderId,
          status: 'completed',
          processedAt: new Date().toISOString(),
        },
      });
    }

    // Deduct inventory via recipes
    const orderService = strapi.service('api::order.order');
    if (Array.isArray(items)) {
      await orderService.deductInventory(orderId, items, currentShift?.id);
    }

    // Update shift totals
    if (currentShift && payment) {
      const shiftService = strapi.service('api::shift.shift');
      await shiftService.addSale(
        currentShift.id,
        order.total || 0,
        payment.method || 'cash'
      );
    }

    // Return complete order with relations
    const completeOrder = await strapi.db.query('api::order.order').findOne({
      where: { id: orderId },
      populate: ['items', 'payment', 'shift'],
    });

    return { data: completeOrder };
  },
}));
