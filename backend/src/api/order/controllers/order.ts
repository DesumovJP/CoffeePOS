import { factories } from '@strapi/strapi';
import { validateRequired, validateNumber, validateArray, validateEnum, ValidationError } from '../../../utils/validate';
import { canTransition, getTimestampField, getAllowedTransitions } from '../../../utils/order-state-machine';
import { InsufficientStockError } from '../services/order';

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

    // Idempotency: if an order with this orderNumber already exists, return it.
    // Clients running the offline-retry queue may re-send the same payload after
    // a network blip — this makes the endpoint safe to retry without duplicating
    // orders, inventory deductions, or shift sales.
    const existing = await strapi.db.query('api::order.order').findOne({
      where:    { orderNumber: order.orderNumber },
      populate: ['items', 'payment', 'shift'],
    });
    if (existing) {
      ctx.set('X-Idempotent-Replay', '1');
      return { data: existing };
    }

    // Re-price every line from the DB. The client is not trusted: a tampered
    // request could pay ₴1 for a ₴100 product, and stale carts can legitimately
    // disagree with the current catalog. Silent override is the right UX —
    // barista sees the total in the payment modal before confirming.
    if (Array.isArray(items)) {
      for (const item of items) {
        const productWhere = item.productDocumentId
          ? { documentId: item.productDocumentId }
          : item.product ? { id: item.product } : null;
        if (!productWhere) continue;

        const product = await strapi.db.query('api::product.product').findOne({
          where:  productWhere,
          select: ['id', 'price'],
        }) as any;
        if (!product) continue;

        let unitPrice = Number(product.price) || 0;

        const vid = item.variantId || item.sizeId;
        if (vid) {
          const recipe = await strapi.db.query('api::recipe.recipe').findOne({
            where:  { product: product.id, variantId: vid },
            select: ['price'],
          }) as any;
          if (recipe && Number(recipe.price) > 0) {
            unitPrice = Number(recipe.price);
          }
        }

        const itemMods = Array.isArray(item.modifiers) ? item.modifiers : [];
        for (const mod of itemMods) {
          const modId = parseInt(String(mod?.id ?? ''), 10);
          if (!modId || Number.isNaN(modId)) continue;
          const modRow = await strapi.db.query('api::modifier.modifier').findOne({
            where:  { id: modId },
            select: ['price'],
          }) as any;
          if (modRow) unitPrice += Number(modRow.price) || 0;
        }

        const qty = Number(item.quantity) || 1;
        item.unitPrice  = unitPrice;
        item.totalPrice = unitPrice * qty;
      }
    }

    // Validate and calculate discounts
    let subtotal = 0;
    if (Array.isArray(items)) {
      subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);
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

    // Force payment.amount to the server-computed total so the payment record
    // can never diverge from what was owed. receivedAmount / changeAmount stay
    // client-supplied (the server can't verify cash on the counter).
    if (payment) {
      payment.amount = total;
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

    // Deduct inventory via recipes. If any row would go negative we roll back
    // everything — refund whatever partial deductions succeeded, delete the
    // order skeleton, and return 409. The client treats this as a hard fail
    // (it is NOT queued for retry; the stock won't magically appear).
    const orderService = strapi.service('api::order.order') as any;
    if (Array.isArray(items)) {
      try {
        await orderService.deductInventory(orderId, items, currentShift?.id);
      } catch (err: any) {
        if (err instanceof InsufficientStockError) {
          try {
            await orderService.refundInventory(orderId, currentShift?.id);
          } catch { /* best-effort; we're already on the error path */ }
          await strapi.db.query('api::order-item.order-item').deleteMany({ where: { order: orderId } });
          await strapi.db.query('api::payment.payment').deleteMany({ where: { order: orderId } });
          await strapi.db.query('api::order.order').delete({ where: { id: orderId } });
          ctx.status = 409;
          ctx.body   = {
            error: {
              status:  409,
              name:    'InsufficientStock',
              message: `Недостатньо запасів: ${err.label || err.table}. Залишок: ${err.available}, потрібно: ${err.requested}.`,
              details: {
                resource:  err.table,
                id:        err.rowId,
                label:     err.label,
                requested: err.requested,
                available: err.available,
              },
            },
          };
          return;
        }
        throw err;
      }
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

    const currentShift = await strapi.db.query('api::shift.shift').findOne({
      where: { status: 'open' },
    });

    // Refund inventory on cancellation — reverses the `sale` transactions so
    // cancelled orders don't permanently starve stock. Idempotent.
    let refund: { refunded: number; alreadyRefunded: boolean } | undefined;
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const orderService = strapi.service('api::order.order') as any;
      refund = await orderService.refundInventory(order.id, currentShift?.id);
    }

    if (currentShift) {
      const shiftService = strapi.service('api::shift.shift') as any;
      await shiftService.logActivity(currentShift.id, 'order_status', {
        orderId: id,
        orderNumber: order.orderNumber,
        fromStatus: order.status,
        toStatus: status,
        ...(refund ? { refundedLines: refund.refunded } : {}),
      });
    }

    return { data: updated, meta: refund ? { refund } : undefined };
  },
}));
