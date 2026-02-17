import { factories } from '@strapi/strapi';
import { validateRequired, validateNumber, validateArray, validateEnum, ValidationError } from '../../../utils/validate';
import { canTransition, getTimestampField, getAllowedTransitions } from '../../../utils/order-state-machine';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  /**
   * Create order with items, payment, inventory deduction, and shift tracking
   */
  async create(ctx) {
    const { order, items, payment } = ctx.request.body?.data || {};

    try {
      if (!order) {
        throw new ValidationError('Order data is required', { order: 'order is required' });
      }

      validateRequired(order, ['orderNumber', 'status', 'type']);
      validateArray(items, 'items', { minLength: 1 });
      for (const item of items) {
        validateRequired(item, ['productName']);
        validateNumber(item.quantity, 'quantity', { min: 1 });
        validateNumber(item.unitPrice, 'unitPrice', { min: 0 });
      }

      if (payment) {
        validateEnum(payment.method, 'payment.method', ['cash', 'card', 'qr', 'online', 'other']);
        validateNumber(payment.amount, 'payment.amount', { min: 0 });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message, { details: error.details });
      }
      throw error;
    }

    // Validate and calculate discounts
    let subtotal = 0;
    if (Array.isArray(items)) {
      subtotal = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0);
    }

    let discountAmount = 0;
    if (order.discountType === 'percentage' && order.discountValue) {
      const pct = Math.min(Math.max(0, order.discountValue), 100);
      discountAmount = subtotal * (pct / 100);
    } else if (order.discountType === 'fixed' && order.discountValue) {
      discountAmount = Math.min(Math.max(0, order.discountValue), subtotal);
    }

    const total = Math.max(0, subtotal - discountAmount);

    // Override with calculated values
    order.subtotal = subtotal;
    order.discountAmount = discountAmount;
    order.total = total;

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
      const shiftService = strapi.service('api::shift.shift') as any;
      await shiftService.addSale(
        currentShift.id,
        total,
        payment.method || 'cash'
      );
      await shiftService.logActivity(currentShift.id, 'order_create', {
        orderId: orderId,
        orderNumber: order.orderNumber,
        items: (items || []).map((item: any) => ({
          name: item.productName || item.name,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
        })),
        total,
        paymentMethod: payment.method || 'cash',
      });
    }

    // Return complete order with relations
    const completeOrder = await strapi.db.query('api::order.order').findOne({
      where: { id: orderId },
      populate: ['items', 'payment', 'shift'],
    });

    return { data: completeOrder };
  },

  /**
   * Update order status with state machine validation
   */
  async updateStatus(ctx) {
    const { id } = ctx.params;
    const { status } = ctx.request.body?.data || {};

    if (!status) return ctx.badRequest('status is required');

    const order = await strapi.db.query('api::order.order').findOne({ where: { id } });
    if (!order) return ctx.notFound('Order not found');

    if (!canTransition(order.status, status)) {
      return ctx.badRequest(
        `Cannot transition from '${order.status}' to '${status}'. Allowed: ${getAllowedTransitions(order.status).join(', ') || 'none'}`
      );
    }

    const updateData: Record<string, any> = { status };
    const timestampField = getTimestampField(status);
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    const updated = await strapi.db.query('api::order.order').update({
      where: { id },
      data: updateData,
      populate: ['items', 'payment', 'shift'],
    });

    // Log order status change
    const currentShift = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });
    if (currentShift) {
      const shiftService = strapi.service('api::shift.shift') as any;
      await shiftService.logActivity(currentShift.id, 'order_status', {
        orderId: id,
        orderNumber: order.orderNumber,
        fromStatus: order.status,
        toStatus: status,
      });
    }

    return { data: updated };
  },
}));
